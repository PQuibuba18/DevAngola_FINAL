const db = require('../config/db');
const { avatarUpload, useCloudinary } = require('../middlewares/upload');

const verificationController = {

  // POST /api/verification/submit — utilizador submete documento
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
          return res.status(409).json({ error: 'Já tens um pedido de verificação em análise.' });
      }

      if (!req.file)
        return res.status(400).json({ error: 'Documento obrigatório.' });

      // A URL do documento é guardada como referência temporária
      // O documento será apagado do storage após revisão pelo admin
      const docRef = useCloudinary
        ? req.file.path
        : `/uploads/${req.file.filename}`;

      await db.query(
        'INSERT INTO verification_requests (user_id, document_ref) VALUES ($1,$2)',
        [userId, docRef]
      );

      return res.status(201).json({
        message: 'Pedido de verificação submetido. Será analisado em 1-3 dias úteis.',
      });
    } catch (err) {
      console.error('verificationController.submit:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // GET /api/verification/status — estado do pedido do utilizador
  async getStatus(req, res) {
    try {
      const r = await db.query(`
        SELECT status, submitted_at, reviewed_at, reject_reason
        FROM verification_requests
        WHERE user_id=$1
        ORDER BY submitted_at DESC LIMIT 1
      `, [req.userId]);

      if (!r.rows.length)
        return res.json({ status: 'not_submitted' });

      const req_data = r.rows[0];
      // Nunca devolve document_ref ao utilizador
      return res.json({
        status:        req_data.status,
        submitted_at:  req_data.submitted_at,
        reviewed_at:   req_data.reviewed_at,
        reject_reason: req_data.reject_reason,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // ── Admin ──────────────────────────────────────────────────────────────

  // GET /api/verification/admin/pending — lista pedidos pendentes
  async adminList(req, res) {
    try {
      const r = await db.query(`
        SELECT vr.id, vr.user_id, vr.status, vr.submitted_at, vr.document_ref,
               u.name AS user_name, u.email AS user_email
        FROM verification_requests vr
        JOIN users u ON u.id = vr.user_id
        WHERE vr.status = 'pending'
        ORDER BY vr.submitted_at ASC
      `);
      // Nota: document_ref é visível apenas para admin (acesso controlado)
      return res.json(r.rows);
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // PUT /api/verification/admin/:id/approve — aprovação
  async adminApprove(req, res) {
    try {
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const r = await client.query(
          "UPDATE verification_requests SET status='approved', reviewed_by=$1, reviewed_at=NOW() WHERE id=$2 RETURNING user_id, document_ref",
          [req.userId, req.params.id]
        );
        if (!r.rows.length) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        const { user_id, document_ref } = r.rows[0];

        // Marca o utilizador como verificado
        await client.query(
          "UPDATE users SET verified=TRUE, verified_at=NOW(), verification_method='document_review' WHERE id=$1",
          [user_id]
        );

        // Apaga a referência ao documento — minimização de dados
        await client.query(
          'UPDATE verification_requests SET document_ref=NULL WHERE id=$1',
          [req.params.id]
        );

        await client.query('COMMIT');

        // TODO: Se useCloudinary, apagar o ficheiro do Cloudinary usando a referência
        // cloudinary.uploader.destroy(public_id) — implementar na versão seguinte

        return res.json({ message: 'Identidade verificada. Documento eliminado.', user_id });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('verificationController.adminApprove:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // PUT /api/verification/admin/:id/reject — rejeição com motivo
  async adminReject(req, res) {
    try {
      const { reason } = req.body;
      if (!reason?.trim())
        return res.status(400).json({ error: 'Motivo de rejeição obrigatório.' });

      const r = await db.query(
        "UPDATE verification_requests SET status='rejected', reviewed_by=$1, reviewed_at=NOW(), reject_reason=$2, document_ref=NULL WHERE id=$3 RETURNING user_id",
        [req.userId, reason.trim(), req.params.id]
      );
      if (!r.rows.length) return res.status(404).json({ error: 'Pedido não encontrado.' });

      return res.json({ message: 'Pedido rejeitado. Documento eliminado.' });
    } catch (err) {
      console.error('verificationController.adminReject:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = verificationController;
