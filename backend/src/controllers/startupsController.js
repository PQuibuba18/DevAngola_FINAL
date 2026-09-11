const db = require('../config/db');

const startupsController = {

  async list(req, res) {
    try {
      const { industry, stage, hiring, cofounder } = req.query;
      const params = [];
      let where = 'WHERE TRUE';
      if (industry)          { params.push(industry);          where += ` AND s.industry=$${params.length}`; }
      if (stage)             { params.push(stage);             where += ` AND s.stage=$${params.length}`; }
      if (hiring === 'true') { where += ' AND s.is_hiring=TRUE'; }
      if (cofounder === 'true') { where += ' AND s.is_seeking_cofounder=TRUE'; }
      params.push(30);
      const r = await db.query(`
        SELECT s.*, u.name AS founder_name, u.avatar_url AS founder_avatar,
          (SELECT COUNT(*)::int FROM startup_members WHERE startup_id=s.id) AS team_size_actual
        FROM startups s
        JOIN users u ON u.id=s.founder_id
        ${where}
        ORDER BY s.created_at DESC
        LIMIT $${params.length}
      `, params);
      return res.json(r.rows);
    } catch (err) {
      console.error('startups.list:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getOne(req, res) {
    try {
      const [s, members] = await Promise.all([
        db.query(`
          SELECT s.*, u.name AS founder_name, u.avatar_url AS founder_avatar
          FROM startups s JOIN users u ON u.id=s.founder_id WHERE s.id=$1
        `, [req.params.id]),
        db.query(`
          SELECT sm.*, u.name, u.avatar_url, u.level, u.identifier
          FROM startup_members sm JOIN users u ON u.id=sm.user_id
          WHERE sm.startup_id=$1
        `, [req.params.id]),
      ]);
      if (!s.rows[0]) return res.status(404).json({ error: 'Startup não encontrada.' });
      return res.json({ ...s.rows[0], members: members.rows });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async create(req, res) {
    try {
      const { name, tagline, description, industry, stage, city, website,
              is_hiring, is_seeking_investment, is_seeking_cofounder, founded_year } = req.body;
      if (!name || !description || !industry) return res.status(400).json({ error: 'Nome, descrição e indústria obrigatórios.' });
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const r = await client.query(`
          INSERT INTO startups (founder_id, name, tagline, description, industry, stage, city,
            website, is_hiring, is_seeking_investment, is_seeking_cofounder, founded_year)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
        `, [req.userId, name, tagline||null, description, industry, stage||'idea',
            city||'Luanda', website||null, !!is_hiring, !!is_seeking_investment, !!is_seeking_cofounder, founded_year||null]);
        await client.query(
          'INSERT INTO startup_members (startup_id, user_id, role) VALUES ($1,$2,$3)',
          [r.rows[0].id, req.userId, 'Founder']
        );
        await client.query('COMMIT');
        return res.status(201).json(r.rows[0]);
      } catch (err) { await client.query('ROLLBACK'); throw err; }
      finally { client.release(); }
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  // Oportunidades de financiamento
  async listFunding(req, res) {
    try {
      const { type } = req.query;
      const params = [];
      let where = 'WHERE (deadline IS NULL OR deadline >= CURRENT_DATE)';
      if (type) { params.push(type); where += ` AND type=$${params.length}`; }
      params.push(20);
      const r = await db.query(
        `SELECT * FROM funding_opportunities ${where} ORDER BY deadline ASC NULLS LAST LIMIT $${params.length}`,
        params
      );
      return res.json(r.rows);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async createFunding(req, res) {
    try {
      const { title, description, type, organizer, amount, deadline, application_url, eligibility } = req.body;
      if (!title || !description || !type || !organizer) return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
      const r = await db.query(`
        INSERT INTO funding_opportunities (title, description, type, organizer, amount, deadline, application_url, eligibility, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
      `, [title, description, type, organizer, amount||null, deadline||null, application_url||null, eligibility||null, req.userId]);
      return res.status(201).json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  // Founder Match
  async requestMatch(req, res) {
    try {
      const { startup_id, role_sought, message } = req.body;
      const targetId = parseInt(req.params.targetId, 10);
      if (targetId === req.userId) return res.status(400).json({ error: 'Não podes enviar match para ti próprio.' });
      const r = await db.query(`
        INSERT INTO founder_matches (requester_id, target_id, startup_id, role_sought, message)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (requester_id, target_id, startup_id) DO NOTHING RETURNING *
      `, [req.userId, targetId, startup_id||null, role_sought||null, message||null]);
      if (!r.rows[0]) return res.status(409).json({ error: 'Já enviaste um pedido a este utilizador.' });
      return res.status(201).json({ message: 'Pedido enviado!', match: r.rows[0] });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async getMyMatches(req, res) {
    try {
      const r = await db.query(`
        SELECT fm.*, u.name AS requester_name, u.avatar_url AS requester_avatar, u.level AS requester_level
        FROM founder_matches fm
        JOIN users u ON u.id=fm.requester_id
        WHERE fm.target_id=$1 ORDER BY fm.created_at DESC
      `, [req.userId]);
      return res.json(r.rows);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async respondMatch(req, res) {
    try {
      const { status } = req.body;
      if (!['accepted','rejected'].includes(status)) return res.status(400).json({ error: 'Estado inválido.' });
      const r = await db.query(
        'UPDATE founder_matches SET status=$1 WHERE id=$2 AND target_id=$3 RETURNING *',
        [status, req.params.id, req.userId]
      );
      if (!r.rows[0]) return res.status(404).json({ error: 'Pedido não encontrado.' });
      return res.json({ message: `Pedido ${status}.`, match: r.rows[0] });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },
};

module.exports = startupsController;
