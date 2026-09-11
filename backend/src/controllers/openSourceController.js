const db = require('../config/db');

const openSourceController = {

  async list(req, res) {
    try {
      const { category, stack, status } = req.query;
      const params = [];
      let where = "WHERE TRUE";
      if (category) { params.push(category); where += ` AND p.category=$${params.length}`; }
      if (status)   { params.push(status);   where += ` AND p.status=$${params.length}`; }
      if (stack)    { params.push(stack);    where += ` AND $${params.length}=ANY(p.stack)`; }
      params.push(30);
      const r = await db.query(`
        SELECT p.*, u.name AS owner_name, u.avatar_url AS owner_avatar, u.verified AS owner_verified,
          (SELECT COUNT(*)::int FROM open_source_contributors oc WHERE oc.project_id=p.id) AS contributors_count
        FROM open_source_projects p
        JOIN users u ON u.id=p.owner_id
        ${where}
        ORDER BY p.is_featured DESC, p.stars_count DESC, p.created_at DESC
        LIMIT $${params.length}
      `, params);
      return res.json(r.rows);
    } catch (err) {
      console.error('openSource.list:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getOne(req, res) {
    try {
      const [proj, contribs] = await Promise.all([
        db.query(`
          SELECT p.*, u.name AS owner_name, u.avatar_url AS owner_avatar
          FROM open_source_projects p JOIN users u ON u.id=p.owner_id WHERE p.id=$1
        `, [req.params.id]),
        db.query(`
          SELECT oc.role, u.id, u.name, u.avatar_url, u.level
          FROM open_source_contributors oc JOIN users u ON u.id=oc.user_id
          WHERE oc.project_id=$1 ORDER BY oc.joined_at
        `, [req.params.id]),
      ]);
      if (!proj.rows[0]) return res.status(404).json({ error: 'Projecto não encontrado.' });
      return res.json({ ...proj.rows[0], contributors: contribs.rows });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async create(req, res) {
    try {
      const { name, description, repo_url, demo_url, website_url, stack, category } = req.body;
      if (!name || !description || !repo_url) return res.status(400).json({ error: 'Nome, descrição e repositório obrigatórios.' });
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const r = await client.query(`
          INSERT INTO open_source_projects (owner_id, name, description, repo_url, demo_url, website_url, stack, category)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
        `, [req.userId, name, description, repo_url, demo_url||null, website_url||null, stack||[], category||null]);
        await client.query(
          'INSERT INTO open_source_contributors (project_id, user_id, role) VALUES ($1,$2,$3)',
          [r.rows[0].id, req.userId, 'owner']
        );
        await client.query('COMMIT');
        return res.status(201).json(r.rows[0]);
      } catch (err) { await client.query('ROLLBACK'); throw err; }
      finally { client.release(); }
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async star(req, res) {
    try {
      const existing = await db.query(
        'SELECT 1 FROM open_source_stars WHERE project_id=$1 AND user_id=$2', [req.params.id, req.userId]
      );
      if (existing.rows.length) {
        await db.query('DELETE FROM open_source_stars WHERE project_id=$1 AND user_id=$2', [req.params.id, req.userId]);
        await db.query('UPDATE open_source_projects SET stars_count=GREATEST(0,stars_count-1) WHERE id=$1', [req.params.id]);
        return res.json({ starred: false });
      } else {
        await db.query('INSERT INTO open_source_stars (project_id, user_id) VALUES ($1,$2)', [req.params.id, req.userId]);
        await db.query('UPDATE open_source_projects SET stars_count=stars_count+1 WHERE id=$1', [req.params.id]);
        return res.json({ starred: true });
      }
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },
};

module.exports = openSourceController;
