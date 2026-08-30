const db = require('../config/db');

const UserModel = {

  async create({ name, email, password, level, nationality, portfolioUrl }) {
    const r = await db.query(
      `INSERT INTO users (name, email, password, level, nationality, portfolio_url)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, email, level, nationality, role, badge, badge_label, theme, language, created_at`,
      [name, email, password, level || 'pendente', nationality, portfolioUrl || null]
    );
    return r.rows[0];
  },

  async findByEmail(email) {
    const r = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    return r.rows[0];
  },

  async findById(id) {
    const r = await db.query(
      `SELECT id, name, email, level, nationality, avatar_url, bio,
              identifier, role, badge, badge_label, theme, language,
              is_active, created_at
       FROM users WHERE id=$1`,
      [id]
    );
    return r.rows[0];
  },

  async findAll(level = null) {
    let q = `SELECT id, name, email, level, nationality, avatar_url, bio,
                    identifier, role, badge, badge_label, is_active,
                    created_at,
                    (SELECT COUNT(*) FROM posts WHERE user_id=users.id)::int AS total_posts
             FROM users`;
    const v = [];
    if (level) { q += ' WHERE level=$1'; v.push(level); }
    q += ' ORDER BY created_at DESC';
    const r = await db.query(q, v);
    return r.rows;
  },

  async updateAvatar(id, url) {
    const r = await db.query(
      'UPDATE users SET avatar_url=$1 WHERE id=$2 RETURNING id, name, avatar_url',
      [url, id]
    );
    return r.rows[0];
  },

  async updateIdentifier(id, identifier) {
    const r = await db.query(
      'UPDATE users SET identifier=$1 WHERE id=$2 RETURNING id, identifier',
      [identifier, id]
    );
    return r.rows[0];
  },

  async updatePreferences(id, { theme, language }) {
    const r = await db.query(
      'UPDATE users SET theme=$1, language=$2 WHERE id=$3 RETURNING id, theme, language',
      [theme, language, id]
    );
    return r.rows[0];
  },

  // ── Admin operations ───────────────────────────────────────
  async adminUpdatePassword(id, hashedPassword) {
    await db.query('UPDATE users SET password=$1 WHERE id=$2', [hashedPassword, id]);
  },

  async adminUpdateRole(id, role) {
    const r = await db.query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, role',
      [role, id]
    );
    return r.rows[0];
  },

  async adminSetBadge(id, badge, badgeLabel) {
    const r = await db.query(
      'UPDATE users SET badge=$1, badge_label=$2 WHERE id=$3 RETURNING id, name, badge, badge_label',
      [badge, badgeLabel, id]
    );
    return r.rows[0];
  },

  async adminRemoveBadge(id) {
    const r = await db.query(
      'UPDATE users SET badge=NULL, badge_label=NULL WHERE id=$1 RETURNING id, name, badge',
      [id]
    );
    return r.rows[0];
  },

  async adminToggleActive(id, isActive) {
    const r = await db.query(
      'UPDATE users SET is_active=$1 WHERE id=$2 RETURNING id, name, is_active',
      [isActive, id]
    );
    return r.rows[0];
  },

  async adminDelete(id) {
    await db.query('DELETE FROM users WHERE id=$1', [id]);
  },

  // ── Sistema de seguidores ──────────────────────────────────

  async follow(followerId, followingId) {
    await db.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [followerId, followingId]
    );
  },

  async unfollow(followerId, followingId) {
    await db.query(
      'DELETE FROM follows WHERE follower_id=$1 AND following_id=$2',
      [followerId, followingId]
    );
  },

  async isFollowing(followerId, followingId) {
    const r = await db.query(
      'SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2',
      [followerId, followingId]
    );
    return r.rows.length > 0;
  },

  async getFollowCounts(userId) {
    const r = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM follows WHERE following_id = $1) AS followers,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id  = $1) AS following
    `, [userId]);
    return r.rows[0];
  },

  // IDs de todos os utilizadores que este utilizador segue
  async getFollowingIds(userId) {
    const r = await db.query(
      'SELECT following_id FROM follows WHERE follower_id=$1',
      [userId]
    );
    return r.rows.map(row => row.following_id);
  },

  async getFollowers(userId) {
    const r = await db.query(`
      SELECT u.id, u.name, u.avatar_url, u.level, u.badge, u.badge_label, u.identifier
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);
    return r.rows;
  },

  async getFollowing(userId) {
    const r = await db.query(`
      SELECT u.id, u.name, u.avatar_url, u.level, u.badge, u.badge_label, u.identifier
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);
    return r.rows;
  },
};

module.exports = UserModel;
