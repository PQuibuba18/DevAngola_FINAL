const PassportModel = require('../models/passportModel');

const passportController = {

  // GET /api/passport/:userId — passport público
  async getPassport(req, res) {
    try {
      const passport = await PassportModel.getFullPassport(req.params.userId);
      if (!passport) return res.status(404).json({ error: 'Utilizador não encontrado.' });

      // Recalcula o score sempre que alguém visita o passport (async — não bloqueia)
      PassportModel.recomputeScore(req.params.userId).catch(() => {});

      return res.json(passport);
    } catch (err) {
      console.error('passportController.getPassport:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // POST /api/passport/experience
  async addExperience(req, res) {
    try {
      const { type, title, organization, location, start_date, end_date, description, is_current } = req.body;
      if (!title || !organization || !start_date)
        return res.status(400).json({ error: 'Título, organização e data de início são obrigatórios.' });

      const exp = await PassportModel.addExperience(req.userId, {
        type, title, organization, location,
        start_date, end_date: is_current ? null : end_date,
        description, is_current: !!is_current,
      });
      return res.status(201).json(exp);
    } catch (err) {
      console.error('passportController.addExperience:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // PUT /api/passport/experience/:id
  async updateExperience(req, res) {
    try {
      const updated = await PassportModel.updateExperience(req.params.id, req.userId, req.body);
      if (!updated) return res.status(404).json({ error: 'Experiência não encontrada.' });
      return res.json(updated);
    } catch (err) {
      console.error('passportController.updateExperience:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // DELETE /api/passport/experience/:id
  async deleteExperience(req, res) {
    try {
      await PassportModel.deleteExperience(req.params.id, req.userId);
      return res.json({ message: 'Experiência removida.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // POST /api/passport/review/:revieweeId
  async addReview(req, res) {
    try {
      const revieweeId = parseInt(req.params.revieweeId, 10);
      if (revieweeId === req.userId)
        return res.status(400).json({ error: 'Não podes avaliar-te a ti próprio.' });

      const { score, comment, context } = req.body;
      if (!score) return res.status(400).json({ error: 'Score obrigatório.' });

      const review = await PassportModel.addReview(req.userId, revieweeId, { score, comment, context });

      // Recalcula score do avaliado
      PassportModel.recomputeScore(revieweeId).catch(() => {});

      return res.status(201).json(review);
    } catch (err) {
      console.error('passportController.addReview:', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  // POST /api/passport/score/compute — recalcula o score do utilizador autenticado
  async computeScore(req, res) {
    try {
      const score = await PassportModel.recomputeScore(req.userId);
      return res.json(score);
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = passportController;
