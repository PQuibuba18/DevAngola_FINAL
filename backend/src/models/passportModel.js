// passportModel.js
// Agrega TODOS os dados do Professional Passport de um utilizador.
// Reutiliza dados existentes: skills, projects, quiz, mentorship, jobs.
// Adiciona: experience, reviews, talent_score.

const db = require('../config/db');

const PassportModel = {

  async getFullPassport(userId) {
    const [
      user, skills, experience, projects,
      reviews, mentorship, score, activity,
    ] = await Promise.all([

      // Dados base do utilizador
      db.query(`
        SELECT u.id, u.name, u.email, u.level, u.avatar_url, u.bio,
               u.identifier, u.badge, u.badge_label, u.verified,
               u.nationality, u.created_at, u.role,
               (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers_count,
               (SELECT COUNT(*)::int FROM follows WHERE follower_id  = u.id) AS following_count
        FROM users u WHERE u.id = $1
      `, [userId]),

      // Skills com nível 1-5
      db.query(`
        SELECT skill, level
        FROM user_skills WHERE user_id = $1
        ORDER BY level DESC, skill
      `, [userId]),

      // Experiência profissional
      db.query(`
        SELECT id, type, title, organization, location,
               start_date, end_date, description, is_current
        FROM professional_experience
        WHERE user_id = $1
        ORDER BY is_current DESC, start_date DESC
      `, [userId]),

      // Projectos onde participou (concluídos ou em progresso)
      db.query(`
        SELECT p.id, p.title, p.description, p.status, p.level_min,
               pm.role AS member_role, p.updated_at,
               COALESCE(
                 json_agg(DISTINCT ps.skill) FILTER (WHERE ps.skill IS NOT NULL),
                 '[]'
               ) AS skills_used,
               (SELECT COUNT(*)::int FROM project_members pm2 WHERE pm2.project_id = p.id) AS team_size
        FROM project_members pm
        JOIN projects p ON p.id = pm.project_id
        LEFT JOIN project_skills ps ON ps.project_id = p.id
        WHERE pm.user_id = $1
        GROUP BY p.id, pm.role
        ORDER BY p.updated_at DESC
        LIMIT 10
      `, [userId]),

      // Reviews recebidas
      db.query(`
        SELECT pr.score, pr.comment, pr.context, pr.created_at,
               u.name AS reviewer_name, u.avatar_url AS reviewer_avatar,
               u.level AS reviewer_level
        FROM professional_reviews pr
        JOIN users u ON u.id = pr.reviewer_id
        WHERE pr.reviewee_id = $1
        ORDER BY pr.created_at DESC
      `, [userId]),

      // Mentoria — como mentor e como mentee
      db.query(`
        SELECT
          (SELECT COUNT(*)::int FROM mentorship_requests
           WHERE mentor_id = $1 AND status = 'accepted') AS mentees_active,
          (SELECT COUNT(*)::int FROM mentorship_requests
           WHERE mentee_id = $1 AND status = 'accepted') AS mentors_had,
          (SELECT available FROM mentors WHERE user_id = $1) AS is_mentor
      `, [userId]),

      // Talent Score (pré-calculado)
      db.query(`
        SELECT score, score_identity, score_skills, score_projects,
               score_reviews, score_community, score_mentorship,
               score_reliability, computed_at
        FROM talent_scores WHERE user_id = $1
      `, [userId]),

      // Actividade geral
      db.query(`
        SELECT
          (SELECT COUNT(*)::int FROM posts WHERE user_id = $1)                             AS total_posts,
          (SELECT COUNT(*)::int FROM posts WHERE user_id = $1 AND is_open_source = TRUE)   AS open_source_posts,
          (SELECT COUNT(*)::int FROM likes l JOIN posts p ON p.id = l.post_id WHERE p.user_id = $1) AS total_likes_received,
          (SELECT COUNT(*)::int FROM comments WHERE user_id = $1)                          AS total_comments,
          (SELECT COUNT(*)::int FROM job_applications WHERE user_id = $1 AND status = 'accepted') AS jobs_accepted,
          (SELECT level_assigned FROM quiz_results WHERE user_id = $1 ORDER BY taken_at DESC LIMIT 1) AS last_quiz_level,
          (SELECT score FROM quiz_results WHERE user_id = $1 ORDER BY taken_at DESC LIMIT 1) AS last_quiz_score
      `, [userId]),
    ]);

    if (!user.rows[0]) return null;

    return {
      user:       user.rows[0],
      skills:     skills.rows,
      experience: experience.rows,
      projects:   projects.rows,
      reviews:    reviews.rows,
      mentorship: mentorship.rows[0] || { mentees_active: 0, mentors_had: 0, is_mentor: false },
      talent_score: score.rows[0] || null,
      activity:   activity.rows[0] || {},
    };
  },

  // ── Experiência ──────────────────────────────────────────────

  async addExperience(userId, { type, title, organization, location, start_date, end_date, description, is_current }) {
    const r = await db.query(`
      INSERT INTO professional_experience
        (user_id, type, title, organization, location, start_date, end_date, description, is_current)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [userId, type || 'work', title, organization, location || null,
        start_date, end_date || null, description || null, is_current || false]);
    return r.rows[0];
  },

  async updateExperience(id, userId, data) {
    const { type, title, organization, location, start_date, end_date, description, is_current } = data;
    const r = await db.query(`
      UPDATE professional_experience
      SET type=$1, title=$2, organization=$3, location=$4,
          start_date=$5, end_date=$6, description=$7, is_current=$8
      WHERE id=$9 AND user_id=$10
      RETURNING *
    `, [type, title, organization, location || null,
        start_date, end_date || null, description || null, is_current || false,
        id, userId]);
    return r.rows[0];
  },

  async deleteExperience(id, userId) {
    await db.query(
      'DELETE FROM professional_experience WHERE id=$1 AND user_id=$2',
      [id, userId]
    );
  },

  // ── Reviews ──────────────────────────────────────────────────

  async addReview(reviewerId, revieweeId, { score, comment, context }) {
    if (reviewerId === revieweeId)
      throw new Error('Não podes avaliar-te a ti próprio.');
    if (score < 1 || score > 5)
      throw new Error('Score entre 1 e 5.');

    const r = await db.query(`
      INSERT INTO professional_reviews (reviewer_id, reviewee_id, score, comment, context)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (reviewer_id, reviewee_id)
      DO UPDATE SET score=$3, comment=$4, context=$5, created_at=NOW()
      RETURNING *
    `, [reviewerId, revieweeId, score, comment || null, context || 'collaboration']);
    return r.rows[0];
  },

  // ── Talent Score ─────────────────────────────────────────────

  async recomputeScore(userId) {
    await db.query('SELECT recompute_talent_score($1)', [userId]);
    const r = await db.query('SELECT * FROM talent_scores WHERE user_id=$1', [userId]);
    return r.rows[0];
  },
};

module.exports = PassportModel;
