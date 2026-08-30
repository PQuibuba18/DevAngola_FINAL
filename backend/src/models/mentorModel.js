const db = require('../config/db');

const MentorModel = {

  async findAll({ specialty, page = 1, limit = 20 } = {}) {
    const params = [limit, (page - 1) * limit];
    let join = '';
    if (specialty) {
      params.unshift(specialty.toLowerCase());
      join = `AND $1 = ANY(m.specialties)`;
    }

    const r = await db.query(`
      SELECT m.*, u.name, u.avatar_url, u.level, u.identifier, u.badge, u.badge_label,
        (SELECT COUNT(*) FROM mentorship_requests mr
         WHERE mr.mentor_id = m.user_id AND mr.status = 'accepted')::int AS active_mentees
      FROM mentors m
      JOIN users u ON u.id = m.user_id
      WHERE m.available = TRUE ${join}
      ORDER BY active_mentees ASC, m.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    return r.rows;
  },

  async findByUser(userId) {
    const r = await db.query(
      'SELECT * FROM mentors WHERE user_id=$1',
      [userId]
    );
    return r.rows[0];
  },

  async register(userId, { bio, specialties, max_mentees }) {
    const r = await db.query(`
      INSERT INTO mentors (user_id, bio, specialties, max_mentees)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id)
      DO UPDATE SET bio=$2, specialties=$3, max_mentees=$4, available=TRUE
      RETURNING *
    `, [userId, bio || null, specialties || [], max_mentees || 3]);
    return r.rows[0];
  },

  async toggleAvailability(userId) {
    const r = await db.query(
      'UPDATE mentors SET available = NOT available WHERE user_id=$1 RETURNING available',
      [userId]
    );
    return r.rows[0];
  },

  async requestMentorship(menteeId, mentorId, { message, skill_focus }) {
    // Verifica limite de mentees
    const mentor = await this.findByUser(mentorId);
    if (!mentor || !mentor.available)
      throw new Error('Mentor não disponível.');

    const active = await db.query(
      "SELECT COUNT(*) FROM mentorship_requests WHERE mentor_id=$1 AND status='accepted'",
      [mentorId]
    );
    if (parseInt(active.rows[0].count, 10) >= (mentor.max_mentees || 3))
      throw new Error('Este mentor já atingiu o limite de aprendizes activos.');

    const r = await db.query(`
      INSERT INTO mentorship_requests (mentee_id, mentor_id, message, skill_focus)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (mentee_id, mentor_id) DO NOTHING
      RETURNING *
    `, [menteeId, mentorId, message || null, skill_focus || null]);
    return r.rows[0];
  },

  async updateRequestStatus(requestId, status) {
    const r = await db.query(
      'UPDATE mentorship_requests SET status=$1 WHERE id=$2 RETURNING *',
      [status, requestId]
    );
    return r.rows[0];
  },

  async getRequestsForMentor(mentorId) {
    const r = await db.query(`
      SELECT mr.*, u.name AS mentee_name, u.avatar_url AS mentee_avatar,
             u.level AS mentee_level, u.identifier AS mentee_identifier
      FROM mentorship_requests mr
      JOIN users u ON u.id = mr.mentee_id
      WHERE mr.mentor_id = $1
      ORDER BY mr.created_at DESC
    `, [mentorId]);
    return r.rows;
  },
};

module.exports = MentorModel;
