// controllers/adminController.js — Painel de administração
const bcrypt    = require('bcryptjs');
const UserModel = require('../models/userModel');
const PostModel = require('../models/postModel');
const db        = require('../config/db');

const adminController = {

  // ── Dashboard stats ─────────────────────────────────────────
  async stats(req, res) {
    try {
      const [users, posts, comments, likes] = await Promise.all([
        db.query('SELECT COUNT(*)::int AS total FROM users'),
        db.query('SELECT COUNT(*)::int AS total FROM posts'),
        db.query('SELECT COUNT(*)::int AS total FROM comments'),
        db.query('SELECT COUNT(*)::int AS total FROM likes'),
      ]);
      return res.json({
        users:    users.rows[0].total,
        posts:    posts.rows[0].total,
        comments: comments.rows[0].total,
        likes:    likes.rows[0].total,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // ── Gestão de utilizadores ───────────────────────────────────
  async listUsers(req, res) {
    try {
      const users = await UserModel.findAll();
      return res.json(users);
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // Altera a senha de qualquer utilizador
  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;
      if (!new_password || new_password.length < 6)
        return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
      const hashed = await bcrypt.hash(new_password, 10);
      await UserModel.adminUpdatePassword(id, hashed);
      return res.json({ message: 'Senha alterada com sucesso.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // Altera o role (admin / user)
  async changeRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!['user','admin'].includes(role))
        return res.status(400).json({ error: 'Role inválido.' });
      if (Number(id) === req.userId)
        return res.status(400).json({ error: 'Não podes alterar o teu próprio role.' });
      const updated = await UserModel.adminUpdateRole(id, role);
      return res.json({ message: 'Role actualizado.', user: updated });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // Atribui ou altera o selo
  async setBadge(req, res) {
    try {
      const { id } = req.params;
      const { badge, badge_label } = req.body;
      if (!badge || !badge_label)
        return res.status(400).json({ error: 'badge e badge_label são obrigatórios.' });
      const updated = await UserModel.adminSetBadge(id, badge, badge_label);
      return res.json({ message: 'Selo atribuído!', user: updated });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // Remove o selo
  async removeBadge(req, res) {
    try {
      const { id } = req.params;
      const updated = await UserModel.adminRemoveBadge(id);
      return res.json({ message: 'Selo removido.', user: updated });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // Activa / desactiva (banir) utilizador
  async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      if (Number(id) === req.userId)
        return res.status(400).json({ error: 'Não podes banir-te a ti mesmo.' });
      const updated = await UserModel.adminToggleActive(id, is_active);
      return res.json({ message: is_active ? 'Utilizador activado.' : 'Utilizador banido.', user: updated });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // Elimina utilizador definitivamente
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      if (Number(id) === req.userId)
        return res.status(400).json({ error: 'Não podes eliminar a tua própria conta.' });
      await UserModel.adminDelete(id);
      return res.json({ message: 'Utilizador eliminado.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // ── Gestão de posts ─────────────────────────────────────────
  async listPosts(req, res) {
    try {
      const posts = await PostModel.findAll();
      return res.json(posts);
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async deletePost(req, res) {
    try {
      const { id } = req.params;
      await PostModel.adminDelete(id);
      return res.json({ message: 'Post eliminado.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = adminController;
