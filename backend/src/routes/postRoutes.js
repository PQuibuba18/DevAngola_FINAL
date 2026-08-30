const express   = require('express');
const router    = express.Router();
const ctrl      = require('../controllers/postController');
const { authMiddleware } = require('../middlewares/auth');
const { postUpload }     = require('../middlewares/upload');

// Middleware opcional: popula req.userId se token existir, sem bloquear anónimos
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();
  const token = header.split(' ')[1];
  if (!token)  return next();
  try {
    const jwt     = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId    = decoded.id;
    req.userRole  = decoded.role || 'user';
  } catch {}
  next();
}

router.get('/',    optionalAuth, ctrl.getAll);
router.get('/:id',              ctrl.getOne);
router.post('/', authMiddleware,
  postUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  ctrl.create
);
router.post('/:id/like',    authMiddleware, ctrl.toggleLike);
router.post('/:id/comment', authMiddleware, ctrl.addComment);

module.exports = router;
