const MentorModel = require('../models/mentorModel');

const mentorController = {

  async getAll(req, res) {
    try {
      const { specialty, page, limit } = req.query;
      const mentors = await MentorModel.findAll({
        specialty,
        page:  parseInt(page,  10) || 1,
        limit: Math.min(50, parseInt(limit, 10) || 20),
      });
      return res.json(mentors);
    } catch (err) {
      console.error('mentorController.getAll:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // POST /api/mentors/register — sénior regista-se como mentor
  async register(req, res) {
    try {
      const { bio, specialties, max_mentees } = req.body;
      if (!Array.isArray(specialties) || specialties.length === 0)
        return res.status(400).json({ error: 'Indica pelo menos uma especialidade.' });

      const mentor = await MentorModel.register(req.userId, {
        bio,
        specialties: specialties.map(s => s.toLowerCase().trim()).slice(0, 10),
        max_mentees: parseInt(max_mentees, 10) || 3,
      });
      return res.status(201).json({ message: 'Registado como mentor!', mentor });
    } catch (err) {
      console.error('mentorController.register:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async toggleAvailability(req, res) {
    try {
      const result = await MentorModel.toggleAvailability(req.userId);
      if (!result) return res.status(404).json({ error: 'Perfil de mentor não encontrado.' });
      return res.json({ available: result.available });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // POST /api/mentors/:mentorId/request — pede mentoria
  async request(req, res) {
    try {
      const mentorId = parseInt(req.params.mentorId, 10);
      if (mentorId === req.userId)
        return res.status(400).json({ error: 'Não podes pedir mentoria a ti mesmo.' });

      const { message, skill_focus } = req.body;
      const mentorship = await MentorModel.requestMentorship(req.userId, mentorId, {
        message, skill_focus,
      });
      if (!mentorship)
        return res.status(409).json({ error: 'Já existe um pedido de mentoria com este mentor.' });
      return res.status(201).json({ message: 'Pedido enviado!', mentorship });
    } catch (err) {
      console.error('mentorController.request:', err.message);
      return res.status(400).json({ error: err.message });
    }
  },

  // GET /api/mentors/requests — lista pedidos recebidos pelo mentor autenticado
  async getRequests(req, res) {
    try {
      const requests = await MentorModel.getRequestsForMentor(req.userId);
      return res.json(requests);
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // PUT /api/mentors/requests/:id — aceita ou rejeita pedido
  async updateRequest(req, res) {
    try {
      const { status } = req.body;
      if (!['accepted','rejected','completed'].includes(status))
        return res.status(400).json({ error: 'Estado inválido.' });

      const updated = await MentorModel.updateRequestStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ error: 'Pedido não encontrado.' });
      return res.json({ message: 'Estado actualizado.', request: updated });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = mentorController;
