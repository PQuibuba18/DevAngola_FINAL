// controllers/rankingController.js
const RankingModel = require('../models/rankingModel');

const rankingController = {
  async top5(req, res) {
    try {
      const ranking = await RankingModel.getTop5();
      return res.json(ranking);
    } catch (err) {
      console.error('Ranking error:', err);
      return res.status(500).json({ error: 'Erro ao buscar ranking.' });
    }
  },
};

module.exports = rankingController;
