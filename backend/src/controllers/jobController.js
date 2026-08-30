const JobModel  = require('../models/jobModel');
const UserModel = require('../models/userModel');

const VALID_LEVELS = ['iniciante','junior','pleno','senior','qualquer'];
const VALID_TYPES  = ['full-time','part-time','freelance','remoto'];

const jobController = {

  async getAll(req, res) {
    try {
      const { level, type, page, limit } = req.query;
      if (level && !VALID_LEVELS.includes(level))
        return res.status(400).json({ error: 'Nível inválido.' });
      if (type && !VALID_TYPES.includes(type))
        return res.status(400).json({ error: 'Tipo inválido.' });

      const jobs = await JobModel.findAll({
        level, type,
        page:  parseInt(page,  10) || 1,
        limit: Math.min(50, parseInt(limit, 10) || 20),
      });
      return res.json(jobs);
    } catch (err) {
      console.error('jobController.getAll:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getOne(req, res) {
    try {
      const job = await JobModel.findById(req.params.id);
      if (!job) return res.status(404).json({ error: 'Vaga não encontrada.' });

      // Se utilizador autenticado, indica se já se candidatou
      let applied = false;
      if (req.userId) applied = await JobModel.hasApplied(job.id, req.userId);

      return res.json({ ...job, applied });
    } catch (err) {
      console.error('jobController.getOne:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // GET /api/jobs/matching — vagas compatíveis com as skills do utilizador autenticado
  async getMatching(req, res) {
    try {
      const jobs = await JobModel.findMatchingForUser(req.userId, 10);
      return res.json(jobs);
    } catch (err) {
      console.error('jobController.getMatching:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async create(req, res) {
    try {
      const { company_name, title, description, level_required, location, type, contact_email, skills } = req.body;

      if (!company_name || !title || !description || !level_required || !contact_email)
        return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
      if (!VALID_LEVELS.includes(level_required))
        return res.status(400).json({ error: 'Nível inválido.' });
      if (type && !VALID_TYPES.includes(type))
        return res.status(400).json({ error: 'Tipo inválido.' });

      const skillsArray = Array.isArray(skills) ? skills.slice(0, 15) : [];

      const job = await JobModel.create({
        company_name, title, description, level_required,
        location, type, contact_email,
        posted_by: req.userId,
        skills:    skillsArray,
      });
      return res.status(201).json({ message: 'Vaga publicada!', job });
    } catch (err) {
      console.error('jobController.create:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // POST /api/jobs/:id/apply — candidatura
  async apply(req, res) {
    try {
      const { id }       = req.params;
      const { cover_note } = req.body;

      const job = await JobModel.findById(id);
      if (!job)           return res.status(404).json({ error: 'Vaga não encontrada.' });
      if (!job.is_active) return res.status(400).json({ error: 'Esta vaga já não está activa.' });

      const already = await JobModel.hasApplied(id, req.userId);
      if (already) return res.status(409).json({ error: 'Já te candidataste a esta vaga.' });

      const application = await JobModel.apply(id, req.userId, cover_note);
      if (!application) return res.status(409).json({ error: 'Candidatura já registada.' });
      return res.status(201).json({ message: 'Candidatura enviada!', application });
    } catch (err) {
      console.error('jobController.apply:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // GET /api/jobs/:id/applications — lista de candidatos (apenas quem publicou ou admin)
  async getApplications(req, res) {
    try {
      const job = await JobModel.findById(req.params.id);
      if (!job) return res.status(404).json({ error: 'Vaga não encontrada.' });
      if (job.posted_by !== req.userId && req.userRole !== 'admin')
        return res.status(403).json({ error: 'Acesso negado.' });

      const applications = await JobModel.getApplications(req.params.id);
      return res.json(applications);
    } catch (err) {
      console.error('jobController.getApplications:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // PUT /api/jobs/applications/:appId — actualiza estado da candidatura
  async updateApplicationStatus(req, res) {
    try {
      const { status } = req.body;
      if (!['reviewed','accepted','rejected'].includes(status))
        return res.status(400).json({ error: 'Estado inválido.' });

      const updated = await JobModel.updateApplicationStatus(req.params.appId, status);
      if (!updated) return res.status(404).json({ error: 'Candidatura não encontrada.' });
      return res.json({ message: 'Estado actualizado.', application: updated });
    } catch (err) {
      console.error('jobController.updateApplicationStatus:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // Admin
  async adminDeactivate(req, res) {
    try {
      await JobModel.deactivate(req.params.id);
      return res.json({ message: 'Vaga desactivada.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = jobController;
