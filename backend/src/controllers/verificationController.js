const db            = require('../config/db');
const { analyzeBI } = require('../services/ocrService');
const { useCloudinary } = require('../middlewares/upload');
const fs            = require('fs');

const verificationController = {

  // GET /api/verification/status
  async getStatus(req, res) {
    try {
      const r = await db.query(`
        SELECT status, submitted_at, reviewed_at, reject_reason, ocr_confidence, ocr_method
        FROM verification_requests
        WHERE user_id = $1
        ORDER BY submitted_at DESC LIMIT 1
      `, [req.userId]);

      if (!r.rows.length) return res.json({ status: 'not_submitted' });

      const row = r.rows[0];
      return res.json({
        status:       row.status,
        submitted_at: row.submitted_at,
        reviewed_at:  row.reviewed_at,
        reject_reason:row.reject_reason,
        ocr_method:   row.ocr_method,
      });
    } catch (err) {
      console.error('verification.getStatus:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // POST /api/verification/submit
  async submit(req, res) {
    try {
      const userId = req.userId;

      // Verifica se já existe pedido pendente ou aprovado
      const existing = await db.query(
        "SELECT status FROM verification_requests WHERE user_id=$1 ORDER BY submitted_at DESC LIMIT 1",
        [userId]
      );
      if (existing.rows.length > 0) {
        const { status } = existing.rows[0];
        if (status === 'approved')
          return res.status(409).json({ error: 'A tua identidade já foi verificada.' });
        if (status === 'pending')
          return res.status(409).json({ error: 'Já tens um pedido em análise. Aguarda.' });
      }

      if (!req.file)
        return res.status(400).json({ error: 'Documento obrigatório.' });

      // Caminho local do ficheiro (para OCR)
      const localPath = req.file.path;
      const docRef    = useCloudinary ? req.file.path : `/uploads/${req.file.filename}`;

      // ── OCR automático ────────────────────────────────────
      let ocrResult = { is_angolan: false, confidence: 0, method: 'error', reason: '' };

      // Só corre OCR em ficheiros locais (Cloudinary devolve URL, não path local)
      if (!useCloudinary && localPath && fs.existsSync(localPath)) {
        ocrResult = await analyzeBI(localPath);
      } else if (useCloudinary) {
        // Em produção com Cloudinary, o ficheiro está na cloud
        // Não temos acesso local — vai para revisão manual
        ocrResult = { is_angolan: true, confidence: 0, method: 'manual_review',
          reason: 'Análise automática não disponível com Cloudinary. Revisão manual.' };
      }

      // ── Decisão ───────────────────────────────────────────
      let status     = 'pending';
      let verified   = false;

      if (ocrResult.method === 'automatic' && ocrResult.is_angolan) {
        // Confiança alta → aprova automaticamente
        status   = 'approved';
        verified = true;
      } else if (!ocrResult.is_angolan && ocrResult.method === 'rejected') {
        // Claramente não angolano → rejeita
        status = 'rejected';
      }
      // Caso "manual_review" → fica pending para admin decidir

      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Guarda o pedido
        await client.query(`
          INSERT INTO verification_requests
            (user_id, status, document_ref, ocr_confidence, ocr_method, ocr_reason,
             reviewed_at, reviewed_by)
          VALUES ($1,$2,$3,$4,$5,$6,
            ${status === 'approved' || status === 'rejected' ? 'NOW()' : 'NULL'},
            ${status === 'approved' || status === 'rejected' ? '0' : 'NULL'})
        `, [userId, status, docRef,
            ocrResult.confidence || 0,
            ocrResult.method     || 'error',
            ocrResult.reason     || '']);

        // Se aprovado automaticamente → marca o user como verificado
        if (verified) {
          await client.query(
            "UPDATE users SET verified=TRUE, verified_at=NOW(), verification_method='ocr_automatic' WHERE id=$1",
            [userId]
          );
          // Apaga a referência ao documento (minimização de dados)
          await client.query(
            "UPDATE verification_requests SET document_ref=NULL WHERE user_id=$1 AND status='approved'",
            [userId]
          );
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      // Resposta ao utilizador
      if (status === 'approved') {
        return res.json({
          status:     'approved',
          verified:   true,
          message:    'Identidade verificada! O teu perfil recebeu o selo ✓ Angolano Verificado.',
          confidence: ocrResult.confidence,
        });
      } else if (status === 'rejected') {
        return res.status(400).json({
          status:  'rejected',
          message: 'Não foi possível confirmar a tua nacionalidade angolana. Certifica-te de enviar o BI ou Passaporte angolano e tenta novamente.',
        });
      } else {
        return res.json({
          status:  'pending',
          message: 'Documento recebido. Será analisado manualmente pelo administrador em 1-3 dias úteis.',
        });
      }

    } catch (err) {
      console.error('verification.submit:', err.message);
      return res.status(500).json({ error: 'Erro interno ao processar documento.' });
    }
  },

  // ── Admin ──────────────────────────────────────────────────

  async adminList(req, res) {
    try {
      const r = await db.query(`
        SELECT vr.id, vr.user_id, vr.status, vr.submitted_at,
               vr.ocr_confidence, vr.ocr_method, vr.ocr_reason,
               u.name AS user_name, u.email AS user_email
        FROM verification_requests vr
        JOIN users u ON u.id = vr.user_id
        WHERE vr.status = 'pending'
        ORDER BY vr.submitted_at ASC
      `);
      return res.json(r.rows);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async adminApprove(req, res) {
    try {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const r = await client.query(
          "UPDATE verification_requests SET status='approved', reviewed_by=$1, reviewed_at=NOW(), document_ref=NULL WHERE id=$2 RETURNING user_id",
          [req.userId, req.params.id]
        );
        if (!r.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Pedido não encontrado.' }); }
        await client.query(
          "UPDATE users SET verified=TRUE, verified_at=NOW(), verification_method='admin_review' WHERE id=$1",
          [r.rows[0].user_id]
        );
        await client.query('COMMIT');
        return res.json({ message: 'Identidade aprovada. Documento eliminado.' });
      } catch (err) { await client.query('ROLLBACK'); throw err; }
      finally { client.release(); }
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async adminReject(req, res) {
    try {
      const { reason } = req.body;
      if (!reason?.trim()) return res.status(400).json({ error: 'Motivo obrigatório.' });
      const r = await db.query(
        "UPDATE verification_requests SET status='rejected', reviewed_by=$1, reviewed_at=NOW(), reject_reason=$2, document_ref=NULL WHERE id=$3 RETURNING user_id",
        [req.userId, reason.trim(), req.params.id]
      );
      if (!r.rows.length) return res.status(404).json({ error: 'Pedido não encontrado.' });
      return res.json({ message: 'Pedido rejeitado.' });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },
};

module.exports = verificationController;
