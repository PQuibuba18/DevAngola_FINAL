const db = require('../config/db');

const workExchangeController = {

  async listProjects(req, res) {
    try {
      const { category, status = 'open' } = req.query;
      const params = [status];
      let where = 'WHERE wp.status=$1';
      if (category) { params.push(category); where += ` AND wp.category=$${params.length}`; }
      params.push(20);
      const r = await db.query(`
        SELECT wp.*,
          u.name AS client_name, u.avatar_url AS client_avatar, u.verified AS client_verified,
          (SELECT COUNT(*)::int FROM work_proposals wpr WHERE wpr.project_id=wp.id) AS proposals_count
        FROM work_projects wp
        JOIN users u ON u.id = wp.client_id
        ${where}
        ORDER BY wp.created_at DESC LIMIT $${params.length}
      `, params);
      return res.json(r.rows);
    } catch (err) {
      console.error('workExchange.listProjects:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getProject(req, res) {
    try {
      const [proj, proposals, milestones] = await Promise.all([
        db.query(`
          SELECT wp.*, u.name AS client_name, u.avatar_url AS client_avatar, u.verified AS client_verified
          FROM work_projects wp JOIN users u ON u.id=wp.client_id WHERE wp.id=$1
        `, [req.params.id]),
        db.query(`
          SELECT wpr.*, u.name AS dev_name, u.avatar_url AS dev_avatar,
                 u.level AS dev_level, u.identifier AS dev_identifier
          FROM work_proposals wpr JOIN users u ON u.id=wpr.developer_id
          WHERE wpr.project_id=$1 ORDER BY wpr.created_at DESC
        `, [req.params.id]),
        db.query('SELECT * FROM work_milestones WHERE project_id=$1 ORDER BY due_date', [req.params.id]),
      ]);
      if (!proj.rows[0]) return res.status(404).json({ error: 'Projecto não encontrado.' });
      return res.json({ ...proj.rows[0], proposals: proposals.rows, milestones: milestones.rows });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async createProject(req, res) {
    try {
      const { title, description, category, budget_min, budget_max, currency, deadline } = req.body;
      if (!title || !description || !category)
        return res.status(400).json({ error: 'Título, descrição e categoria obrigatórios.' });
      const r = await db.query(`
        INSERT INTO work_projects (client_id, title, description, category, budget_min, budget_max, currency, deadline)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
      `, [req.userId, title, description, category, budget_min||null, budget_max||null, currency||'AOA', deadline||null]);
      return res.status(201).json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async submitProposal(req, res) {
    try {
      const { cover_letter, proposed_price, proposed_days } = req.body;
      const proj = await db.query('SELECT client_id FROM work_projects WHERE id=$1', [req.params.id]);
      if (!proj.rows[0]) return res.status(404).json({ error: 'Projecto não encontrado.' });
      if (proj.rows[0].client_id === req.userId)
        return res.status(400).json({ error: 'Não podes enviar proposta para o teu próprio projecto.' });
      const r = await db.query(`
        INSERT INTO work_proposals (project_id, developer_id, cover_letter, proposed_price, proposed_days)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (project_id, developer_id)
        DO UPDATE SET cover_letter=$3, proposed_price=$4, proposed_days=$5
        RETURNING *
      `, [req.params.id, req.userId, cover_letter||null, proposed_price||null, proposed_days||null]);
      return res.status(201).json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async acceptProposal(req, res) {
    try {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const prop = await client.query(
          'SELECT * FROM work_proposals WHERE id=$1', [req.params.proposalId]
        );
        if (!prop.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Proposta não encontrada.' }); }
        const proj = await client.query('SELECT client_id FROM work_projects WHERE id=$1', [prop.rows[0].project_id]);
        if (proj.rows[0].client_id !== req.userId) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Acesso negado.' }); }
        await client.query('UPDATE work_proposals SET status=$1 WHERE id=$2', ['accepted', req.params.proposalId]);
        await client.query('UPDATE work_proposals SET status=$1 WHERE project_id=$2 AND id!=$3', ['rejected', prop.rows[0].project_id, req.params.proposalId]);
        await client.query('UPDATE work_projects SET status=$1, selected_dev=$2 WHERE id=$3', ['in_progress', prop.rows[0].developer_id, prop.rows[0].project_id]);
        await client.query('COMMIT');
        return res.json({ message: 'Proposta aceite. Projecto em progresso.' });
      } catch (err) { await client.query('ROLLBACK'); throw err; }
      finally { client.release(); }
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async addMilestone(req, res) {
    try {
      const { title, description, due_date, amount } = req.body;
      if (!title) return res.status(400).json({ error: 'Título obrigatório.' });
      const r = await db.query(`
        INSERT INTO work_milestones (project_id, title, description, due_date, amount)
        VALUES ($1,$2,$3,$4,$5) RETURNING *
      `, [req.params.id, title, description||null, due_date||null, amount||null]);
      return res.status(201).json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async updateMilestoneStatus(req, res) {
    try {
      const { status } = req.body;
      const valid = ['pending','in_progress','delivered','approved'];
      if (!valid.includes(status)) return res.status(400).json({ error: 'Estado inválido.' });
      const r = await db.query(
        'UPDATE work_milestones SET status=$1 WHERE id=$2 AND project_id=$3 RETURNING *',
        [status, req.params.milestoneId, req.params.id]
      );
      if (!r.rows[0]) return res.status(404).json({ error: 'Milestone não encontrado.' });
      return res.json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async addReview(req, res) {
    try {
      const { score, comment, type } = req.body;
      if (!score || !type) return res.status(400).json({ error: 'Score e tipo obrigatórios.' });
      const proj = await db.query('SELECT * FROM work_projects WHERE id=$1', [req.params.id]);
      if (!proj.rows[0]) return res.status(404).json({ error: 'Projecto não encontrado.' });
      const p = proj.rows[0];
      const revieweeId = type === 'client' ? p.client_id : p.selected_dev;
      if (!revieweeId) return res.status(400).json({ error: 'Sem developer seleccionado.' });
      const r = await db.query(`
        INSERT INTO work_reviews (project_id, reviewer_id, reviewee_id, score, comment, type)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (project_id, reviewer_id)
        DO UPDATE SET score=$4, comment=$5 RETURNING *
      `, [req.params.id, req.userId, revieweeId, score, comment||null, type]);
      return res.status(201).json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },
};

module.exports = workExchangeController;
