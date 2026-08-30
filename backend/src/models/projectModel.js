const db = require('../config/db');

const ProjectModel = {

  async findAll({ status, skill, page = 1, limit = 20 } = {}) {
    const params = [];
    let where = "WHERE p.status != 'archived'";

    if (status) { params.push(status); where += ` AND p.status=$${params.length}`; }

    params.push(limit);
    params.push((page - 1) * limit);

    const r = await db.query(`
      SELECT p.*,
        u.name AS owner_name, u.avatar_url AS owner_avatar,
        (SELECT COUNT(*)::int FROM project_members pm WHERE pm.project_id = p.id) AS member_count,
        COALESCE(json_agg(ps.skill ORDER BY ps.skill) FILTER (WHERE ps.skill IS NOT NULL), '[]') AS skills_needed
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      LEFT JOIN project_skills ps ON ps.project_id = p.id
      ${where}
      GROUP BY p.id, u.name, u.avatar_url
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    return r.rows;
  },

  async findById(id) {
    const [proj, members] = await Promise.all([
      db.query(`
        SELECT p.*,
          u.name AS owner_name, u.avatar_url AS owner_avatar,
          COALESCE(json_agg(DISTINCT ps.skill) FILTER (WHERE ps.skill IS NOT NULL), '[]') AS skills_needed
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        LEFT JOIN project_skills ps ON ps.project_id = p.id
        WHERE p.id = $1
        GROUP BY p.id, u.name, u.avatar_url
      `, [id]),
      db.query(`
        SELECT pm.*, u.name, u.avatar_url, u.level, u.identifier
        FROM project_members pm
        JOIN users u ON u.id = pm.user_id
        WHERE pm.project_id = $1
      `, [id]),
    ]);
    if (!proj.rows[0]) return null;
    return { ...proj.rows[0], members: members.rows };
  },

  async create({ ownerId, title, description, levelMin, skills = [] }) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const r = await client.query(`
        INSERT INTO projects (owner_id, title, description, level_min)
        VALUES ($1,$2,$3,$4) RETURNING *
      `, [ownerId, title, description, levelMin || 'iniciante']);
      const project = r.rows[0];

      // Owner é automaticamente membro
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3)',
        [project.id, ownerId, 'owner']
      );

      for (const skill of skills.slice(0, 10)) {
        await client.query(
          'INSERT INTO project_skills (project_id, skill) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [project.id, skill.toLowerCase().trim()]
        );
      }

      await client.query('COMMIT');
      return project;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async apply(projectId, userId, role, message) {
    const r = await db.query(`
      INSERT INTO project_applications (project_id, user_id, role, message)
      VALUES ($1,$2,$3,$4) ON CONFLICT (project_id, user_id) DO NOTHING RETURNING *
    `, [projectId, userId, role || null, message || null]);
    return r.rows[0];
  },

  async acceptApplication(applicationId) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const r = await client.query(
        'UPDATE project_applications SET status=$1 WHERE id=$2 RETURNING *',
        ['accepted', applicationId]
      );
      const app = r.rows[0];
      if (app) {
        await client.query(
          'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
          [app.project_id, app.user_id, app.role || 'colaborador']
        );
      }
      await client.query('COMMIT');
      return app;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(projectId, status) {
    const r = await db.query(
      'UPDATE projects SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, projectId]
    );
    return r.rows[0];
  },
};

module.exports = ProjectModel;
