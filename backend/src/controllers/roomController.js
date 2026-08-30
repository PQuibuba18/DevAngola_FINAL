const RoomModel  = require('../models/roomModel');
const PostModel  = require('../models/postModel');
const db         = require('../config/db');
const upload     = require('../middlewares/upload');

const VALID_ROOMS = ['iniciante','junior','pleno','senior'];

const roomController = {

  // GET /api/rooms/:level/posts — todos podem ler
  async getPosts(req, res) {
    try {
      const { level } = req.params;
      if (!VALID_ROOMS.includes(level))
        return res.status(400).json({ error: 'Sala invalida.' });

      const posts = await RoomModel.getPosts(level, req.userId);
      return res.json(posts);
    } catch (err) {
      console.error('Room getPosts:', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  // POST /api/rooms/:level/posts — publicar numa sala (verifica nivel)
  async createPost(req, res) {
    try {
      const { level } = req.params;
      if (!VALID_ROOMS.includes(level))
        return res.status(400).json({ error: 'Sala invalida.' });

      // Buscar nivel do utilizador
      const ur = await db.query('SELECT level FROM users WHERE id = $1', [req.userId]);
      const userLevel = ur.rows[0]?.level;

      if (!userLevel || userLevel === 'pendente')
        return res.status(403).json({ error: 'Completa o quiz de nivel primeiro.' });

      if (!RoomModel.canPost(userLevel, level))
        return res.status(403).json({
          error: `O teu nivel (${userLevel}) nao permite publicar na sala ${level}.`,
        });

      const { title, content } = req.body;
      if (!title?.trim() || !content?.trim())
        return res.status(400).json({ error: 'Titulo e conteudo sao obrigatorios.' });

      let image_url = null;
      let file_url  = null;
      let file_name = null;

      if (req.files?.image?.[0]) {
        image_url = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files?.file?.[0]) {
        file_url  = `/uploads/${req.files.file[0].filename}`;
        file_name = req.files.file[0].originalname;
      }

      const r = await db.query(
        `INSERT INTO posts (user_id, title, content, image_url, file_url, file_name, room)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [req.userId, title.trim(), content.trim(), image_url, file_url, file_name, level]
      );

      const post = await PostModel.findById(r.rows[0].id);
      return res.status(201).json(post);
    } catch (err) {
      console.error('Room createPost:', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = roomController;
