const db = require('../config/db');

const QuizModel = {

  async getRandom() {
    const r = await db.query(`
      SELECT id, question, option_a, option_b, option_c, option_d, category, difficulty
      FROM quiz_questions
      WHERE is_active = TRUE
      ORDER BY RANDOM()
      LIMIT 5
    `);
    return r.rows;
  },

  async evaluate(answers) {
    if (!answers || answers.length !== 5)
      throw new Error('São necessárias exactamente 5 respostas.');

    const ids = answers.map(a => a.questionId);
    const r   = await db.query(
      'SELECT id, correct FROM quiz_questions WHERE id = ANY($1)',
      [ids]
    );

    const correctMap = {};
    r.rows.forEach(row => { correctMap[row.id] = row.correct; });

    let score = 0;
    answers.forEach(a => {
      if (correctMap[a.questionId] && correctMap[a.questionId] === a.answer) score++;
    });
    return score;
  },

  scoreToLevel(score) {
    if (score <= 1) return 'iniciante';
    if (score === 2) return 'junior';
    if (score === 3) return 'pleno';
    return 'senior';
  },

  // CORRECÇÃO DO BUG DE TRANSACÇÃO:
  // Antes: db.query('BEGIN') + db.query('COMMIT') usava conexões diferentes do pool
  // Agora: client único do pool do início ao fim da transacção
  async saveResult(userId, score, level) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO quiz_results (user_id, score, level_assigned) VALUES ($1,$2,$3)',
        [userId, score, level]
      );
      await client.query(
        'UPDATE users SET level=$1, quiz_expires_at=$2 WHERE id=$3',
        [level, expiresAt.toISOString(), userId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async needsQuiz(userId) {
    const r = await db.query(
      'SELECT level, quiz_expires_at FROM users WHERE id=$1',
      [userId]
    );
    const user = r.rows[0];
    if (!user) return false;
    if (user.level === 'pendente') return true;
    if (!user.quiz_expires_at) return false;
    return new Date(user.quiz_expires_at) < new Date();
  },

  // Verifica cooldown: utilizador só pode refazer o quiz 24h após a última tentativa
  async isOnCooldown(userId) {
    const r = await db.query(
      `SELECT taken_at FROM quiz_results
       WHERE user_id=$1
       ORDER BY taken_at DESC LIMIT 1`,
      [userId]
    );
    if (!r.rows.length) return false;
    const last = new Date(r.rows[0].taken_at);
    const diff = (Date.now() - last.getTime()) / (1000 * 60 * 60); // horas
    return diff < 24;
  },

  async getAll() {
    const r = await db.query('SELECT * FROM quiz_questions ORDER BY difficulty, id');
    return r.rows;
  },

  async create({ question, option_a, option_b, option_c, option_d, correct, category, difficulty }) {
    const r = await db.query(
      `INSERT INTO quiz_questions
         (question, option_a, option_b, option_c, option_d, correct, category, difficulty)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [question, option_a, option_b, option_c, option_d, correct, category, difficulty]
    );
    return r.rows[0];
  },

  async delete(id) {
    await db.query('DELETE FROM quiz_questions WHERE id=$1', [id]);
  },
};

module.exports = QuizModel;
