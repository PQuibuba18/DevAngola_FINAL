
const db = require('../config/db');

const MessageModel = {

  async findOrCreateConversation(userA, userB) {
    const a = Math.min(userA, userB);
    const b = Math.max(userA, userB);

    let res = await db.query(
      `SELECT id FROM conversations WHERE user_a = $1 AND user_b = $2`,
      [a, b]
    );
    if (res.rows.length > 0) return res.rows[0].id;

    res = await db.query(
      `INSERT INTO conversations (user_a, user_b) VALUES ($1, $2) RETURNING id`,
      [a, b]
    );
    return res.rows[0].id;
  },

  async getOtherUserId(conversationId, userId) {
    const res = await db.query(
      `SELECT user_a, user_b FROM conversations WHERE id = $1`,
      [conversationId]
    );
    if (res.rows.length === 0) return null;
    const { user_a, user_b } = res.rows[0];
    return user_a === userId ? user_b : user_a;
  },

  async listConversations(userId) {
    const res = await db.query(`
      SELECT
        c.id AS conversation_id,
        CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS other_id,
        u.name AS other_name,
        u.avatar_url AS other_avatar,
        u.level AS other_level,
        m.content AS last_message,
        m.created_at AS last_at,
        COUNT(m2.id) FILTER (WHERE m2.read = FALSE AND m2.sender_id != $1) AS unread
      FROM conversations c
      JOIN users u ON u.id = CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END
      LEFT JOIN LATERAL (
        SELECT content, created_at FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC LIMIT 1
      ) m ON TRUE
      LEFT JOIN messages m2 ON m2.conversation_id = c.id
      WHERE c.user_a = $1 OR c.user_b = $1
      GROUP BY c.id, u.id, u.name, u.avatar_url, u.level, m.content, m.created_at
      ORDER BY m.created_at DESC NULLS LAST
    `, [userId]);
    return res.rows;
  },

  async getMessages(conversationId, userId) {
    await db.query(
      `UPDATE messages SET read = TRUE
       WHERE conversation_id = $1 AND recipient_id = $2 AND read = FALSE`,
      [conversationId, userId]
    );

    const res = await db.query(`
      SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [conversationId]);
    return res.rows;
  },

  async send(conversationId, senderId, content) {
    const recipientId = await MessageModel.getOtherUserId(conversationId, senderId);
    if (!recipientId) return null;

    const res = await db.query(`
      INSERT INTO messages (conversation_id, sender_id, recipient_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [conversationId, senderId, recipientId, content]);

    const enriched = await db.query(`
      SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id = $1
    `, [res.rows[0].id]);
    return enriched.rows[0];
  },

  async unreadCount(userId) {
    const res = await db.query(`
      SELECT COUNT(*)::int AS total FROM messages
      WHERE recipient_id = $1 AND read = FALSE
    `, [userId]);
    return res.rows[0].total;
  },

  async userBelongs(conversationId, userId) {
    const res = await db.query(
      `SELECT 1 FROM conversations WHERE id = $1 AND (user_a = $2 OR user_b = $2)`,
      [conversationId, userId]
    );
    return res.rows.length > 0;
  },
};

module.exports = MessageModel;
