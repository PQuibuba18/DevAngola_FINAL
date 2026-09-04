const db            = require('../config/db');
const { analyzeBI } = require('../services/ocrService');
const { useCloudinary } = require('../middlewares/upload');
const fs            = require('fs');

const verificationController = {

  async getStatus(req, res) {
    try {
      const r = await db.query(`
        SELECT status, submitted_at, reviewed_at, reject_reason,
               ocr_confidence, ocr_method
        FROM verification_requests
        WHERE user_id = $1
        ORDER BY submitted_at DESC LIMIT 1
      `, [req.userId]);

      if (!r.rows.length) return res.json({ status: 'not_submitted' });
      const row = r.rows[0];
      return res.json({
        status:        row.status,
        submitted_at:  row.submitted_at,
        reviewed_at:   row.reviewed_at,
        reject_reason: row.reject_reason,
        ocr_method:    row.ocr_method,
      });
    } catch (err) {
      console.error('verification.getStatus:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async submit(req, res) {
    try {
      const userId = req.userId;

      // Admin: verificado automaticamente, mas o pedido ainda é registado
      // para o histórico — o admin não revê a si próprio
      const userCheck = await db.query(
        'SELECT role, name FROM users WHERE id=$1',
        [userId]
      );
      const isAdmin = userCheck.rows[0]?.role === 'admin';

      if (isAdmin) {
        await db.query(
          `UPDATE users SET verified=TRUE, verified_at=NOW(),
           verification_method='admin_auto' WHERE id=$1`,
          [userId]
        );
        // Regista o pedido como aprovado automaticamente
        await db.query(
          `INSERT INTO verification_requests
             (user_id, status, ocr_method, ocr_reason, ocr_confidence, reviewed_at, reviewed_by)
           VALUES ($1,'approved','admin_auto','Administrador verificado automaticamente.',100,NOW(),$1)
           ON CONFLICT DO NOTHING`,
          [userId]
        );
        return res.json({
          status:   'approved',
          verified: true,
          message:  'Administrador verificado automaticamente.',
        });
      }

      // Verifica pedido existente
      const existing = await db.query(
        `SELECT status FROM verification_requests
         WHERE user_id=$1 ORDER BY submitted_at DESC LIMIT 1`,
        [userId]
      );
      if (existing.rows.length > 0) {
        const s = existing.rows[0].status;
        if (s === 'approved')
          return res.status(409).json({ error: 'A tua identidade já foi verificada.' });
        if (s === 'pending')
          return res.status(409).json({ error: 'Já tens um pedido em análise. Aguarda.' });
      }

      if (!req.file)
        return res.status(400).json({ error: 'Documento obrigatório.' });

      const localPath = req.file.path;
      const docRef    = useCloudinary
        ? req.file.path
        : `/uploads/${req.file.filename}`;

      // OCR — tenta detectar automaticamente
      let ocrResult = {
        is_angolan: false, confidence: 0,
        method: 'manual_review', reason: 'Análise manual necessária.',
      };

      if (!useCloudinary && localPath && fs.existsSync(localPath)) {
        ocrResult = await analyzeBI(localPath);
      }

      // ── Regra principal: SEMPRE vai para o admin rever ──────
      // O OCR serve para dar contexto ao admin, não para decidir sozinho.
      // Mesmo com confiança alta, o admin tem a palavra final.
      // Motivo: o OCR pode cometer erros; a verificação de identidade
      // é um acto de responsabilidade que deve ter supervisão humana.

      const ocrApproved = ocrResult.method === 'automatic' && ocrResult.is_angolan;
      const ocrRejected = !ocrResult.is_angolan && ocrResult.method === 'rejected';

      // Status inicial — sempre pending (admin decide)
      // ocrApproved e ocrRejected são apenas sugestões para o admin
      const status = 'pending';

      await db.query(`
        INSERT INTO verification_requests
          (user_id, status, document_ref, ocr_confidence, ocr_method, ocr_reason)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [
        userId, status, docRef,
        ocrResult.confidence || 0,
        ocrResult.method     || 'manual_review',
        ocrResult.reason     || '',
      ]);

      // Resposta ao utilizador — informa sobre a sugestão do OCR
      if (ocrRejected) {
        return res.json({
          status:  'pending',
          message: 'O sistema não conseguiu confirmar a nacionalidade angolana no documento. O pedido foi enviado ao administrador para revisão manual. Certifica-te de que o documento está legível.',
          ocr_suggestion: 'rejected',
        });
      }

      if (ocrApproved) {
        return res.json({
          status:  'pending',
          message: `Documento detectado como angolano (confiança: ${ocrResult.confidence}%). O pedido foi enviado ao administrador para confirmação final. Serás notificado em breve.`,
          ocr_suggestion: 'approved',
        });
      }

      return res.json({
        status:  'pending',
        message: 'Documento recebido e enviado para revisão manual pelo administrador. Serás notificado em 1-3 dias úteis.',
        ocr_suggestion: 'manual',
      });

    } catch (err) {
      console.error('verification.submit:', err.message);
      return res.status(500).json({ error: 'Erro interno ao processar documento.' });
    }
  },

  // Admin: lista TODOS os pedidos pendentes — incluindo os que o OCR aprovou
  async adminList(req, res) {
    try {
      const r = await db.query(`
        SELECT
          vr.id,
          vr.user_id,
          vr.status,
          vr.submitted_at,
          vr.document_ref,
          vr.ocr_confidence,
          vr.ocr_method,
          vr.ocr_reason,
          u.name  AS user_name,
          u.email AS user_email,
          u.level AS user_level
        FROM verification_requests vr
        JOIN users u ON u.id = vr.user_id
        WHERE vr.status = 'pending'
          AND vr.ocr_method != 'admin_auto'
        ORDER BY
          -- Coloca primeiro os que o OCR aprovou (mais fáceis de confirmar)
          CASE vr.ocr_method
            WHEN 'automatic'     THEN 1
            WHEN 'manual_review' THEN 2
            WHEN 'rejected'      THEN 3
            ELSE 4
          END,
          vr.submitted_at ASC
      `);
      return res.json(r.rows);
    } catch (err) {
      console.error('verification.adminList:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async adminApprove(req, res) {
    try {
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const r = await client.query(
          `UPDATE verification_requests
           SET status='approved', reviewed_by=$1, reviewed_at=NOW(), document_ref=NULL
           WHERE id=$2 RETURNING user_id`,
          [req.userId, req.params.id]
        );

        if (!r.rows.length) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        await client.query(
          `UPDATE users
           SET verified=TRUE, verified_at=NOW(), verification_method='admin_review'
           WHERE id=$1`,
          [r.rows[0].user_id]
        );

        await client.query('COMMIT');
        return res.json({ message: 'Identidade aprovada. Documento eliminado.' });

      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('verification.adminApprove:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async adminReject(req, res) {
    try {
      const { reason } = req.body;
      if (!reason?.trim())
        return res.status(400).json({ error: 'Motivo de rejeição obrigatório.' });

      const r = await db.query(
        `UPDATE verification_requests
         SET status='rejected', reviewed_by=$1, reviewed_at=NOW(),
             reject_reason=$2, document_ref=NULL
         WHERE id=$3 RETURNING user_id`,
        [req.userId, reason.trim(), req.params.id]
      );

      if (!r.rows.length)
        return res.status(404).json({ error: 'Pedido não encontrado.' });

      return res.json({ message: 'Pedido rejeitado. Utilizador notificado.' });

    } catch (err) {
      console.error('verification.adminReject:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = verificationController;
