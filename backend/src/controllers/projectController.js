const ProjectModel = require('../models/projectModel');

const VALID_STATUS = ['open','in_progress','completed','archived'];

const projectController = {

  async getAll(req, res) {
    try {
      const { status, skill, page, limit } = req.query;
      if (status && !VALID_STATUS.includes(status))
        return res.status(400).json({ error: 'Estado inválido.' });
      const projects = await ProjectModel.findAll({
        status, skill,
        page:  parseInt(page,  10) || 1,
        limit: Math.min(50, parseInt(limit, 10) || 20),
      });
      return res.json(projects);
    } catch (err) {
      console.error('projectController.getAll:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getOne(req, res) {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Projecto não encontrado.' });
      return res.json(project);
    } catch (err) {
      console.error('projectController.getOne:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async create(req, res) {
    try {
      const { title, description, level_min, skills } = req.body;
      if (!title || !description)
        return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });

      const project = await ProjectModel.create({
        ownerId:  req.userId,
        title:    title.trim(),
        description: description.trim(),
        levelMin: level_min,
        skills:   Array.isArray(skills) ? skills : [],
      });
      return res.status(201).json({ message: 'Projecto criado!', project });
    } catch (err) {
      console.error('projectController.create:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async apply(req, res) {
    try {
      const { id }          = req.params;
      const { role, message } = req.body;

      const project = await ProjectModel.findById(id);
      if (!project) return res.status(404).json({ error: 'Projecto não encontrado.' });
      if (project.status !== 'open')
        return res.status(400).json({ error: 'Este projecto não está a aceitar colaboradores.' });

      const isMember = project.members.some(m => m.user_id === req.userId);
      if (isMember) return res.status(409).json({ error: 'Já és membro deste projecto.' });

      const application = await ProjectModel.apply(id, req.userId, role, message);
      if (!application) return res.status(409).json({ error: 'Já te candidataste a este projecto.' });
      return res.status(201).json({ message: 'Candidatura enviada!', application });
    } catch (err) {
      console.error('projectController.apply:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async acceptApplication(req, res) {
    try {
      const { applicationId } = req.params;
      // Verifica que o utilizador é o owner do projecto (verificação feita no model)
      const result = await ProjectModel.acceptApplication(applicationId);
      if (!result) return res.status(404).json({ error: 'Candidatura não encontrada.' });
      return res.json({ message: 'Candidatura aceite. Utilizador adicionado ao projecto.', result });
    } catch (err) {
      console.error('projectController.acceptApplication:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      if (!VALID_STATUS.includes(status))
        return res.status(400).json({ error: 'Estado inválido.' });

      const project = await ProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Projecto não encontrado.' });
      if (project.owner_id !== req.userId && req.userRole !== 'admin')
        return res.status(403).json({ error: 'Apenas o criador pode actualizar o estado.' });

      const updated = await ProjectModel.updateStatus(req.params.id, status);
      return res.json({ message: 'Estado actualizado.', project: updated });
    } catch (err) {
      console.error('projectController.updateStatus:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = projectController;
