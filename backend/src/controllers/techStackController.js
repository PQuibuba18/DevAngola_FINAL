const db = require('../config/db');

const techStackController = {

  async listQuestions(req, res) {
    try {
      const { tag, angola_only, solved, q } = req.query;
      const params = [];
      let where = 'WHERE TRUE';
      if (tag)         { params.push(tag);    where += ` AND $${params.length}=ANY(qa.tags)`; }
      if (angola_only === 'true') { where += ' AND qa.angola_context=TRUE'; }
      if (solved === 'false') { where += ' AND qa.is_solved=FALSE'; }
      if (q) { params.push(`%${q}%`); where += ` AND (qa.title ILIKE $${params.length} OR qa.body ILIKE $${params.length})`; }
      params.push(20);
      const r = await db.query(`
        SELECT qa.*,
          u.name AS author_name, u.avatar_url AS author_avatar, u.level AS author_level,
          (SELECT COUNT(*)::int FROM qa_answers WHERE question_id=qa.id) AS answers_count,
          COALESCE((SELECT SUM(value) FROM qa_votes WHERE question_id=qa.id), 0) AS vote_score
        FROM qa_questions qa
        JOIN users u ON u.id=qa.user_id
        ${where}
        ORDER BY vote_score DESC, qa.created_at DESC
        LIMIT $${params.length}
      `, params);
      return res.json(r.rows);
    } catch (err) {
      console.error('techStack.listQuestions:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getQuestion(req, res) {
    try {
      const [q, answers] = await Promise.all([
        db.query(`
          SELECT qa.*, u.name AS author_name, u.avatar_url AS author_avatar, u.level AS author_level,
            COALESCE((SELECT SUM(value) FROM qa_votes WHERE question_id=qa.id), 0) AS vote_score
          FROM qa_questions qa JOIN users u ON u.id=qa.user_id WHERE qa.id=$1
        `, [req.params.id]),
        db.query(`
          SELECT a.*, u.name AS author_name, u.avatar_url AS author_avatar, u.level AS author_level,
            COALESCE((SELECT SUM(value) FROM qa_votes WHERE answer_id=a.id), 0) AS vote_score
          FROM qa_answers a JOIN users u ON u.id=a.user_id
          WHERE a.question_id=$1
          ORDER BY a.is_accepted DESC, vote_score DESC
        `, [req.params.id]),
      ]);
      if (!q.rows[0]) return res.status(404).json({ error: 'Pergunta não encontrada.' });
      // Incrementa views
      db.query('UPDATE qa_questions SET views=views+1 WHERE id=$1', [req.params.id]).catch(() => {});
      return res.json({ ...q.rows[0], answers: answers.rows });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async createQuestion(req, res) {
    try {
      const { title, body, tags, angola_context } = req.body;
      if (!title || !body) return res.status(400).json({ error: 'Título e corpo obrigatórios.' });
      const r = await db.query(`
        INSERT INTO qa_questions (user_id, title, body, tags, angola_context)
        VALUES ($1,$2,$3,$4,$5) RETURNING *
      `, [req.userId, title.trim(), body.trim(), tags||[], !!angola_context]);
      return res.status(201).json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async createAnswer(req, res) {
    try {
      const { body } = req.body;
      if (!body) return res.status(400).json({ error: 'Resposta obrigatória.' });
      const r = await db.query(`
        INSERT INTO qa_answers (question_id, user_id, body)
        VALUES ($1,$2,$3) RETURNING *
      `, [req.params.id, req.userId, body.trim()]);
      return res.status(201).json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async acceptAnswer(req, res) {
    try {
      const q = await db.query('SELECT user_id FROM qa_questions WHERE id=$1', [req.params.id]);
      if (!q.rows[0]) return res.status(404).json({ error: 'Pergunta não encontrada.' });
      if (q.rows[0].user_id !== req.userId) return res.status(403).json({ error: 'Apenas o autor pode aceitar respostas.' });
      await db.query('UPDATE qa_answers SET is_accepted=FALSE WHERE question_id=$1', [req.params.id]);
      await db.query('UPDATE qa_answers SET is_accepted=TRUE WHERE id=$1 AND question_id=$2', [req.params.answerId, req.params.id]);
      await db.query('UPDATE qa_questions SET is_solved=TRUE WHERE id=$1', [req.params.id]);
      return res.json({ message: 'Resposta aceite.' });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async vote(req, res) {
    try {
      const { value, question_id, answer_id } = req.body;
      if (![1,-1].includes(Number(value))) return res.status(400).json({ error: 'Valor inválido.' });
      if (!question_id && !answer_id) return res.status(400).json({ error: 'question_id ou answer_id obrigatório.' });
      await db.query(`
        INSERT INTO qa_votes (user_id, question_id, answer_id, value)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (user_id, ${question_id ? 'question_id' : 'answer_id'})
        DO UPDATE SET value=$4
      `, [req.userId, question_id||null, answer_id||null, Number(value)]);
      return res.json({ message: 'Voto registado.' });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },
};

module.exports = techStackController;
