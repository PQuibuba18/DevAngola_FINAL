const db = require('../config/db');

const JobModel = {

  async findAll({ level, type, page = 1, limit = 20 } = {}) {
    const params = [];
    let where    = 'WHERE j.is_active = TRUE';

    if (level) { params.push(level); where += ` AND j.level_required = $${params.length}`; }
    if (type)  { params.push(type);  where += ` AND j.type = $${params.length}`; }

    params.push(limit);
    params.push((page - 1) * limit);

    const r = await db.query(`
      SELECT j.*,
        COALESCE(
          json_agg(js.skill ORDER BY js.skill) FILTER (WHERE js.skill IS NOT NULL),
          '[]'
        ) AS skills,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS application_count
      FROM job_posts j
      LEFT JOIN job_skills js ON js.job_id = j.id
      ${where}
      GROUP BY j.id
      ORDER BY j.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    return r.rows;
  },

  async findById(id) {
    const r = await db.query(`
      SELECT j.*,
        COALESCE(
          json_agg(js.skill ORDER BY js.skill) FILTER (WHERE js.skill IS NOT NULL),
          '[]'
        ) AS skills,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS application_count
      FROM job_posts j
      LEFT JOIN job_skills js ON js.job_id = j.id
      WHERE j.id = $1
      GROUP BY j.id
    `, [id]);
    return r.rows[0];
  },

  async create({ company_name, title, description, level_required, location, type, contact_email, posted_by, skills = [] }) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const r = await client.query(`
        INSERT INTO job_posts (company_name, title, description, level_required, location, type, contact_email, posted_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
      `, [company_name, title, description, level_required, location || 'Luanda', type || 'full-time', contact_email, posted_by]);
      const job = r.rows[0];

      if (skills.length > 0) {
        for (const skill of skills) {
          await client.query(
            'INSERT INTO job_skills (job_id, skill) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [job.id, skill.toLowerCase().trim()]
          );
        }
      }

      await client.query('COMMIT');
      return job;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async deactivate(id) {
    await db.query('UPDATE job_posts SET is_active=FALSE WHERE id=$1', [id]);
  },

  // Matching: encontra vagas compatíveis com as skills do utilizador
  async findMatchingForUser(userId, limit = 10) {
    const r = await db.query(`
      SELECT DISTINCT j.*,
        COALESCE(
          json_agg(js.skill ORDER BY js.skill) FILTER (WHERE js.skill IS NOT NULL),
          '[]'
        ) AS skills,
        COUNT(DISTINCT CASE WHEN js.skill IN (
          SELECT skill FROM user_skills WHERE user_id = $1
        ) THEN js.skill END)::int AS matching_skills
      FROM job_posts j
      LEFT JOIN job_skills js ON js.job_id = j.id
      WHERE j.is_active = TRUE
      GROUP BY j.id
      ORDER BY matching_skills DESC, j.created_at DESC
      LIMIT $2
    `, [userId, limit]);
    return r.rows;
  },

  // Candidatura a uma vaga
  async apply(jobId, userId, coverNote) {
    const r = await db.query(`
      INSERT INTO job_applications (job_id, user_id, cover_note)
      VALUES ($1,$2,$3)
      ON CONFLICT (job_id, user_id) DO NOTHING
      RETURNING *
    `, [jobId, userId, coverNote || null]);
    return r.rows[0];
  },

  async hasApplied(jobId, userId) {
    const r = await db.query(
      'SELECT 1 FROM job_applications WHERE job_id=$1 AND user_id=$2',
      [jobId, userId]
    );
    return r.rows.length > 0;
  },

  async getApplications(jobId) {
    const r = await db.query(`
      SELECT ja.*, u.name, u.avatar_url, u.level, u.identifier,
        COALESCE(
          json_agg(us.skill ORDER BY us.skill) FILTER (WHERE us.skill IS NOT NULL),
          '[]'
        ) AS user_skills
      FROM job_applications ja
      JOIN users u ON u.id = ja.user_id
      LEFT JOIN user_skills us ON us.user_id = ja.user_id
      WHERE ja.job_id = $1
      GROUP BY ja.id, u.id
      ORDER BY ja.applied_at DESC
    `, [jobId]);
    return r.rows;
  },

  async updateApplicationStatus(applicationId, status) {
    const r = await db.query(
      'UPDATE job_applications SET status=$1 WHERE id=$2 RETURNING *',
      [status, applicationId]
    );
    return r.rows[0];
  },
};

module.exports = JobModel;
