const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/openSourceController');
const { authMiddleware } = require('../middlewares/auth');

function optAuth(req, res, next) {
  const h = req.headers.authorization;
  if (h) { try { const { id } = require('jsonwebtoken').verify(h.split(' ')[1], process.env.JWT_SECRET); req.userId = id; } catch {} }
  next();
}

router.get('/',              optAuth, ctrl.list);
router.get('/:id',           optAuth, ctrl.getOne);
router.post('/', authMiddleware,       ctrl.create);
router.post('/:id/star', authMiddleware, ctrl.star);

module.exports = router;
