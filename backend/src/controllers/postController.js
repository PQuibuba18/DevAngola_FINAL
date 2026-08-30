const { useCloudinary } = require('../middlewares/upload');
const PostModel = require('../models/postModel');

const postController = {

  async getAll(req, res) {
    try {
      const { userId, feed, page, limit } = req.query;

      // P1.3 — paginação
      const pageNum  = Math.max(1, parseInt(page,  10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
      const offset   = (pageNum - 1) * limitNum;

      if (userId) {
        const posts = await PostModel.findByUser(userId, limitNum, offset);
        return res.json({ posts, page: pageNum, limit: limitNum });
      }

      if (feed === 'following') {
        if (!req.userId) return res.status(401).json({ error: 'Autenticacao necessaria.' });
        const posts = await PostModel.findByFollowed(req.userId, limitNum, offset);
        return res.json({ posts, page: pageNum, limit: limitNum });
      }

      const posts = await PostModel.findAll(limitNum, offset);
      return res.json({ posts, page: pageNum, limit: limitNum });

    } catch (err) {
      console.error('postController.getAll:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar posts.' });
    }
  },

  async getOne(req, res) {
    try {
      const post = await PostModel.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
      const comments = await PostModel.findComments(req.params.id);
      return res.json({ ...post, comments });
    } catch (err) {
      console.error('postController.getOne:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar post.' });
    }
  },

  async create(req, res) {
    try {
      const { title, content, is_open_source } = req.body;  // P1.2 — extrai is_open_source
      const userId = req.userId;

      if (!title || !content) {
        return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
      }

      // Sanitiza is_open_source: aceita boolean ou string 'true'/'false'
      const isOpenSource = is_open_source === true || is_open_source === 'true';

      let imageUrl = null, fileUrl = null, fileName = null;
      if (req.files) {
        if (req.files.image) {
          imageUrl = useCloudinary ? req.files.image[0].path : `/uploads/${req.files.image[0].filename}`;
        }
        if (req.files.file) {
          fileUrl  = useCloudinary ? req.files.file[0].path : `/uploads/${req.files.file[0].filename}`;
          fileName = req.files.file[0].originalname;
        }
      }

      const post = await PostModel.create({
        userId, title, content, imageUrl, fileUrl, fileName,
        isOpenSource,  // P1.2 — passa para o model
      });

      return res.status(201).json({ message: 'Post criado com sucesso!', post });

    } catch (err) {
      console.error('postController.create:', err.message);
      return res.status(500).json({ error: 'Erro ao criar post.' });
    }
  },

  async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId  = req.userId;
      const already = await PostModel.hasLiked(id, userId);
      if (already) {
        await PostModel.removeLike(id, userId);
        return res.json({ liked: false });
      }
      await PostModel.addLike(id, userId);
      return res.json({ liked: true });
    } catch (err) {
      console.error('postController.toggleLike:', err.message);
      return res.status(500).json({ error: 'Erro ao curtir post.' });
    }
  },

  async addComment(req, res) {
    try {
      const { id }     = req.params;
      const userId      = req.userId;
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comentário não pode estar vazio.' });
      }
      const comment  = await PostModel.addComment(id, userId, content.trim());
      const comments = await PostModel.findComments(id);
      return res.status(201).json({ comment, comments });
    } catch (err) {
      console.error('postController.addComment:', err.message);
      return res.status(500).json({ error: 'Erro ao adicionar comentário.' });
    }
  },
};

module.exports = postController;
