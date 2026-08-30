const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { useCloudinary } = require('../middlewares/upload');

const authController = {

  async register(req, res) {
    try {
      const { name, email, password, level, nationality } = req.body;

      if (!name || !email || !password || !level || !nationality)
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
      if (!['iniciante','junior','pleno','senior'].includes(level))
        return res.status(400).json({ error: 'Nível inválido.' });

      const existing = await UserModel.findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email já está em uso.' });

      const hashed = await bcrypt.hash(password, 10);

      // Guarda URL do portfolio se foi enviado
      let portfolioUrl = null;
      if (req.file) {
        portfolioUrl = useCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
      }

      const newUser = await UserModel.create({
        name, email, password: hashed, level, nationality, portfolioUrl,
      });

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({ message: 'Conta criada com sucesso!', token, user: newUser });
    } catch (err) {
      console.error('authController.register:', err.message);
      return res.status(500).json({ error: 'Erro ao criar conta.' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

      const user = await UserModel.findByEmail(email);
      if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });
      if (user.is_active === false)
        return res.status(403).json({ error: 'Conta suspensa. Contacta o administrador.' });
      if (!await bcrypt.compare(password, user.password))
        return res.status(401).json({ error: 'Credenciais inválidas.' });

      const fullUser = await UserModel.findById(user.id);
      const token = jwt.sign(
        { id: user.id, email: user.email, role: fullUser.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _pw, ...clean } = user;
      return res.json({
        message: 'Login realizado!',
        token,
        user: { ...clean, role: fullUser.role || 'user' },
      });
    } catch (err) {
      console.error('authController.login:', err.message);
      return res.status(500).json({ error: 'Erro ao fazer login.' });
    }
  },

  async refresh(req, res) {
    try {
      const fullUser = await UserModel.findById(req.userId);
      if (!fullUser) return res.status(404).json({ error: 'Utilizador não encontrado.' });
      if (fullUser.is_active === false)
        return res.status(403).json({ error: 'Conta suspensa.' });

      const token = jwt.sign(
        { id: fullUser.id, email: fullUser.email, role: fullUser.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, user: fullUser });
    } catch (err) {
      console.error('authController.refresh:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = authController;
