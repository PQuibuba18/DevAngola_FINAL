const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/roomController');
const { authMiddleware } = require('../middlewares/auth');
const upload  = require('../middlewares/upload');

// Leitura: qualquer utilizador autenticado
router.get('/:level/posts',  authMiddleware, ctrl.getPosts);

// Publicacao: verifica nivel dentro do controller
router.post(
  '/:level/posts',
  authMiddleware,
  upload.fields([{ name:'image', maxCount:1 }, { name:'file', maxCount:1 }]),
  ctrl.createPost
);

module.exports = router;
