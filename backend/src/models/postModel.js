const db = require('../config/db');

// Query base reutilizada em todos os selects de posts
const POST_SELECT = `
  SELECT p.*,
    u.name          AS author_name,
    u.level         AS author_level,
    u.avatar_url    AS author_avatar,
    u.badge         AS author_badge,
    u.badge_label   AS author_badge_label,
    COUNT(DISTINCT l.user_id)::int AS likes_count,
    COUNT(DISTINCT c.id)::int      AS comments_count
  FROM posts p
  JOIN users u ON p.user_id = u.id
  LEFT JOIN likes    l ON p.id = l.post_id
  LEFT JOIN comments c ON p.id = c.post_id
`;

const PostModel = {

  // P1.3 — paginação com LIMIT/OFFSET
  async findAll(limit = 20, offset = 0) {
    const r = await db.query(
      POST_SELECT +
      `GROUP BY p.id, u.name, u.level, u.avatar_url, u.badge, u.badge_label
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return r.rows;
  },

  async findByFollowed(followerId, limit = 20, offset = 0) {
    const r = await db.query(
      POST_SELECT +
      `JOIN follows f ON f.following_id = p.user_id AND f.follower_id = $1
       GROUP BY p.id, u.name, u.level, u.avatar_url, u.badge, u.badge_label
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [followerId, limit, offset]
    );
    return r.rows;
  },

  async findByUser(userId, limit = 20, offset = 0) {
    const r = await db.query(
      POST_SELECT +
      `WHERE p.user_id = $1
       GROUP BY p.id, u.name, u.level, u.avatar_url, u.badge, u.badge_label
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return r.rows;
  },

  async findById(postId) {
    const r = await db.query(
      POST_SELECT +
      `WHERE p.id = $1
       GROUP BY p.id, u.name, u.level, u.avatar_url, u.badge, u.badge_label`,
      [postId]
    );
    return r.rows[0];
  },

  async findComments(postId) {
    const r = await db.query(`
      SELECT c.*, u.name AS author_name,
             u.avatar_url AS author_avatar,
             u.level AS author_level,
             u.badge AS author_badge
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId]);
    return r.rows;
  },

  // P1.2 — isOpenSource agora é passado correctamente
  async create({ userId, title, content, imageUrl, fileUrl, fileName, isOpenSource }) {
    const r = await db.query(
      `INSERT INTO posts (user_id, title, content, image_url, file_url, file_name, is_open_source)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, title, content, imageUrl || null, fileUrl || null, fileName || null, isOpenSource || false]
    );
    return r.rows[0];
  },

  async hasLiked(postId, userId) {
    const r = await db.query(
      'SELECT 1 FROM likes WHERE post_id=$1 AND user_id=$2',
      [postId, userId]
    );
    return r.rows.length > 0;
  },

  async addLike(postId, userId) {
    await db.query('INSERT INTO likes (post_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [postId, userId]);
  },

  async removeLike(postId, userId) {
    await db.query('DELETE FROM likes WHERE post_id=$1 AND user_id=$2', [postId, userId]);
  },

  async addComment(postId, userId, content) {
    const r = await db.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1,$2,$3) RETURNING *',
      [postId, userId, content]
    );
    return r.rows[0];
  },

  async adminDelete(postId) {
    await db.query('DELETE FROM posts WHERE id=$1', [postId]);
  },

  async countByUser(userId) {
    const r = await db.query(
      'SELECT COUNT(*)::int AS total FROM posts WHERE user_id=$1',
      [userId]
    );
    return r.rows[0].total;
  },
};

module.exports = PostModel;
