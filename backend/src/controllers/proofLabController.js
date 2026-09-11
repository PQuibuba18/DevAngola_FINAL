const db = require('../config/db');

const proofLabController = {

  async listChallenges(req, res) {
    try {
      const { category, difficulty } = req.query;
      let where = 'WHERE c.is_active = TRUE';
      const params = [];
      if (category)   { params.push(category);   where += ` AND c.category=$${params.length}`; }
      if (difficulty) { params.push(difficulty); where += ` AND c.difficulty=$${params.length}`; }
      params.push(20); // limit
      const r = await db.query(`
        SELECT c.*,
          (SELECT COUNT(*)::int FROM challenge_submissions cs WHERE cs.challenge_id = c.id) AS submissions_count,
          (SELECT COUNT(*) FILTER (WHERE cs2.status='approved')::int FROM challenge_submissions cs2 WHERE cs2.challenge_id = c.id) AS approved_count,
          ${req.userId ? `(SELECT status FROM challenge_submissions WHERE challenge_id=c.id AND user_id=${req.userId} LIMIT 1) AS my_status` : 'NULL AS my_status'}
        FROM challenges c
        ${where}
        ORDER BY c.is_sponsored DESC, c.created_at DESC
        LIMIT $${params.length}
      `, params);
      return res.json(r.rows);
    } catch (err) {
      console.error('proofLab.listChallenges:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getChallenge(req, res) {
    try {
      const r = await db.query(`
        SELECT c.*,
          (SELECT COUNT(*)::int FROM challenge_submissions WHERE challenge_id=c.id) AS submissions_count
        FROM challenges c WHERE c.id=$1
      `, [req.params.id]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Desafio não encontrado.' });
      return res.json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async submit(req, res) {
    try {
      const { repo_url, demo_url, description } = req.body;
      if (!repo_url) return res.status(400).json({ error: 'URL do repositório obrigatório.' });
      const r = await db.query(`
        INSERT INTO challenge_submissions (challenge_id, user_id, repo_url, demo_url, description)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (challenge_id, user_id)
        DO UPDATE SET repo_url=$3, demo_url=$4, description=$5, submitted_at=NOW()
        RETURNING *
      `, [req.params.id, req.userId, repo_url, demo_url||null, description||null]);
      return res.status(201).json(r.rows[0]);
    } catch (err) {
      console.error('proofLab.submit:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getMySubmissions(req, res) {
    try {
      const r = await db.query(`
        SELECT cs.*, c.title AS challenge_title, c.category, c.difficulty
        FROM challenge_submissions cs
        JOIN challenges c ON c.id = cs.challenge_id
        WHERE cs.user_id=$1 ORDER BY cs.submitted_at DESC
      `, [req.userId]);
      return res.json(r.rows);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  // Admin
  async adminCreate(req, res) {
    try {
      const { title, description, category, difficulty, instructions, deadline_days, sponsor_name } = req.body;
      if (!title || !description || !category || !instructions)
        return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
      const r = await db.query(`
        INSERT INTO challenges (title, description, category, difficulty, instructions, deadline_days, is_sponsored, sponsor_name, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
      `, [title, description, category, difficulty||'junior', instructions, deadline_days||7, !!sponsor_name, sponsor_name||null, req.userId]);
      return res.status(201).json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async adminReviewSubmission(req, res) {
    try {
      const { status, score, feedback } = req.body;
      if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Estado inválido.' });
      const r = await db.query(`
        UPDATE challenge_submissions
        SET status=$1, score=$2, feedback=$3, reviewed_by=$4, reviewed_at=NOW()
        WHERE id=$5 RETURNING *
      `, [status, score||null, feedback||null, req.userId, req.params.submissionId]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Submissão não encontrada.' });
      return res.json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },
};

module.exports = proofLabController;
