const UserModel = require('../models/userModel');
const { useCloudinary } = require('../middlewares/upload');

const userController = {

  async getAll(req, res) {
    try {
      const users = await UserModel.findAll(req.query.level || null);
      return res.json(users);
    } catch (err) {
      console.error('userController.getAll:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar utilizadores.' });
    }
  },

  async getMe(req, res) {
    try {
      const user = await UserModel.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'Utilizador não encontrado.' });
      return res.json(user);
    } catch (err) {
      console.error('userController.getMe:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getOne(req, res) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'Utilizador não encontrado.' });
      const counts = await UserModel.getFollowCounts(req.params.id);
      return res.json({ ...user, ...counts });
    } catch (err) {
      console.error('userController.getOne:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async uploadAvatar(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });

      // Com Cloudinary: req.file.path contém a URL pública
      // Sem Cloudinary (local): construímos o caminho relativo
      const url = useCloudinary
        ? req.file.path          // URL completa do Cloudinary (ex: https://res.cloudinary.com/...)
        : `/uploads/${req.file.filename}`;

      const updated = await UserModel.updateAvatar(req.userId, url);
      return res.json({ message: 'Avatar actualizado!', avatar_url: updated.avatar_url });
    } catch (err) {
      console.error('userController.uploadAvatar:', err.message);
      return res.status(500).json({ error: 'Erro ao actualizar avatar.' });
    }
  },

  async updateIdentifier(req, res) {
    try {
      const { identifier } = req.body;
      if (!identifier?.trim()) return res.status(400).json({ error: 'Identificador vazio.' });
      if (identifier.length > 100) return res.status(400).json({ error: 'Máximo 100 caracteres.' });
      const updated = await UserModel.updateIdentifier(req.userId, identifier.trim());
      return res.json({ message: 'Identificador actualizado!', identifier: updated.identifier });
    } catch (err) {
      console.error('userController.updateIdentifier:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async updatePreferences(req, res) {
    try {
      const { theme, language } = req.body;
      if (theme    && !['light','dark'].includes(theme))
        return res.status(400).json({ error: 'Tema inválido.' });
      if (language && !['pt','en'].includes(language))
        return res.status(400).json({ error: 'Idioma inválido.' });
      const user    = await UserModel.findById(req.userId);
      const updated = await UserModel.updatePreferences(req.userId, {
        theme:    theme    || user.theme    || 'light',
        language: language || user.language || 'pt',
      });
      return res.json({ message: 'Preferências guardadas!', ...updated });
    } catch (err) {
      console.error('userController.updatePreferences:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // POST /api/users/:id/follow — toggle: segue se não segue, deixa de seguir se segue
  async toggleFollow(req, res) {
    try {
      const followerId  = req.userId;
      const followingId = Number(req.params.id);
      if (followerId === followingId)
        return res.status(400).json({ error: 'Não podes seguir-te a ti mesmo.' });

      const already = await UserModel.isFollowing(followerId, followingId);
      if (already) {
        await UserModel.unfollow(followerId, followingId);
      } else {
        await UserModel.follow(followerId, followingId);
      }
      const counts = await UserModel.getFollowCounts(followingId);
      return res.json({ following: !already, ...counts });
    } catch (err) {
      console.error('userController.toggleFollow:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getFollowers(req, res) {
    try {
      const followers = await UserModel.getFollowers(req.params.id);
      return res.json(followers);
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getFollowing(req, res) {
    try {
      const following = await UserModel.getFollowing(req.params.id);
      return res.json(following);
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = userController;
