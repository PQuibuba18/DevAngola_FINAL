const db = require('../config/db');

// Hierarquia de niveis — quem pode publicar em cada sala
const LEVEL_ORDER = { iniciante: 1, junior: 2, pleno: 3, senior: 4 };

const RoomModel = {

  canPost(userLevel, roomLevel) {
    const u = LEVEL_ORDER[userLevel]  || 0;
    const r = LEVEL_ORDER[roomLevel]  || 0;
    // Qualquer nivel pode publicar na sala do seu nivel ou inferior
    // Senior pode publicar em qualquer sala (mentoria)
    return u >= r || userLevel === 'senior';
  },

  async getPosts(roomLevel, userId) {
    const r = await db.query(`
      SELECT
        p.*,
        u.name       AS author_name,
        u.level      AS author_level,
        u.avatar_url AS author_avatar,
        u.badge      AS author_badge,
        u.badge_label AS author_badge_label,
        COUNT(DISTINCT l.user_id)::int AS likes_count,
        COUNT(DISTINCT c.id)::int      AS comments_count,
        EXISTS (
          SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2
        ) AS liked_by_me
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes    l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.room = $1
      GROUP BY p.id, u.name, u.level, u.avatar_url, u.badge, u.badge_label
      ORDER BY p.created_at DESC
    `, [roomLevel, userId || 0]);
    return r.rows;
  },
};

module.exports = RoomModel;
