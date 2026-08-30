const SkillModel = require('../models/skillModel');

const VALID_SKILLS = [
  'javascript','typescript','react','react-native','nextjs','vue','angular',
  'nodejs','express','python','django','fastapi','php','laravel','java','spring',
  'kotlin','swift','flutter','dart','go','rust','c','cpp','csharp','dotnet',
  'postgresql','mysql','mongodb','redis','sqlite',
  'docker','kubernetes','linux','git','aws','gcp','azure',
  'graphql','rest-api','websocket',
  'ui-ux','figma','css','tailwind','sass',
  'machine-learning','data-analysis','tensorflow',
  'devops','ci-cd','terraform',
];

const skillController = {

  async getMySkills(req, res) {
    try {
      const skills = await SkillModel.getUserSkills(req.userId);
      return res.json(skills);
    } catch (err) {
      console.error('skillController.getMySkills:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async setSkill(req, res) {
    try {
      const { skill, level } = req.body;
      if (!skill) return res.status(400).json({ error: 'Skill obrigatória.' });
      const clean = skill.toLowerCase().trim();
      if (!VALID_SKILLS.includes(clean))
        return res.status(400).json({ error: `Skill '${clean}' não reconhecida.` });
      const lvl = parseInt(level, 10) || 1;
      const result = await SkillModel.setSkill(req.userId, clean, lvl);
      return res.json({ message: 'Skill actualizada!', skill: result });
    } catch (err) {
      console.error('skillController.setSkill:', err.message);
      return res.status(500).json({ error: err.message || 'Erro interno.' });
    }
  },

  async removeSkill(req, res) {
    try {
      const { skill } = req.params;
      await SkillModel.removeSkill(req.userId, skill.toLowerCase());
      return res.json({ message: 'Skill removida.' });
    } catch (err) {
      console.error('skillController.removeSkill:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // GET /api/skills/list — devolve a lista de skills válidas (para o frontend)
  async listValid(req, res) {
    return res.json(VALID_SKILLS);
  },

  // GET /api/skills/profile/:userId — portfólio público
  async getPublicProfile(req, res) {
    try {
      const profile = await SkillModel.getPublicProfile(req.params.userId);
      if (!profile) return res.status(404).json({ error: 'Utilizador não encontrado.' });
      return res.json(profile);
    } catch (err) {
      console.error('skillController.getPublicProfile:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = skillController;
