const db = require('../config/db');

const SkillModel = {

  async getUserSkills(userId) {
    const r = await db.query(
      'SELECT skill, level FROM user_skills WHERE user_id=$1 ORDER BY skill',
      [userId]
    );
    return r.rows;
  },

  async setSkill(userId, skill, level = 1) {
    if (level < 1 || level > 5) throw new Error('Nível de skill entre 1 e 5.');
    const r = await db.query(`
      INSERT INTO user_skills (user_id, skill, level)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id, skill)
      DO UPDATE SET level = EXCLUDED.level
      RETURNING *
    `, [userId, skill.toLowerCase().trim(), level]);
    return r.rows[0];
  },

  async removeSkill(userId, skill) {
    await db.query(
      'DELETE FROM user_skills WHERE user_id=$1 AND skill=$2',
      [userId, skill.toLowerCase().trim()]
    );
  },

  // Perfil público: agrega actividade para o portfólio automático
  // Diferencial 9 — portfolio gerado automaticamente a partir de evidências reais
  async getPublicProfile(userId) {
    const [user, skills, posts, jobs] = await Promise.all([
      db.query(`
        SELECT id, name, avatar_url, level, bio, identifier,
               badge, badge_label, verified, created_at
        FROM users WHERE id=$1
      `, [userId]),
      db.query(
        'SELECT skill, level FROM user_skills WHERE user_id=$1 ORDER BY level DESC, skill',
        [userId]
      ),
      db.query(`
        SELECT COUNT(*)::int          AS total_posts,
               COUNT(*) FILTER (WHERE is_open_source)::int AS open_source_posts
        FROM posts WHERE user_id=$1
      `, [userId]),
      db.query(`
        SELECT COUNT(*) FILTER (WHERE status='accepted')::int AS accepted_applications
        FROM job_applications WHERE user_id=$1
      `, [userId]),
    ]);

    if (!user.rows[0]) return null;

    return {
      ...user.rows[0],
      skills:     skills.rows,
      stats: {
        total_posts:           posts.rows[0]?.total_posts || 0,
        open_source_posts:     posts.rows[0]?.open_source_posts || 0,
        accepted_applications: jobs.rows[0]?.accepted_applications || 0,
      },
    };
  },
};

module.exports = SkillModel;
