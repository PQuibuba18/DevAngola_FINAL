// models/rankingModel.js — Top 5 por score (posts*1 + likes*2)
const db = require('../config/db');

const RankingModel = {
  async getTop5() {
    const res = await db.query(`
      SELECT
        u.id,
        u.name,
        u.level,
        u.avatar_url,
        u.identifier,
        u.badge,
        u.badge_label,
        COUNT(DISTINCT p.id)::int                              AS total_posts,
        COALESCE(SUM(lk.like_count), 0)::int                  AS total_likes,
        (COUNT(DISTINCT p.id) + COALESCE(SUM(lk.like_count),0) * 2)::int AS score
      FROM users u
      LEFT JOIN posts p ON p.user_id = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*)::int AS like_count
        FROM likes GROUP BY post_id
      ) lk ON lk.post_id = p.id
      GROUP BY u.id, u.name, u.level, u.avatar_url, u.identifier, u.badge, u.badge_label
      ORDER BY score DESC
      LIMIT 5
    `);
    return res.rows;
  },
};

module.exports = RankingModel;
