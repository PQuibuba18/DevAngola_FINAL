const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/techStackController');
const { authMiddleware } = require('../middlewares/auth');

function optAuth(req, res, next) {
  const h = req.headers.authorization;
  if (h) { try { const { id } = require('jsonwebtoken').verify(h.split(' ')[1], process.env.JWT_SECRET); req.userId = id; } catch {} }
  next();
}

router.get('/',                            optAuth, ctrl.listQuestions);
router.get('/:id',                         optAuth, ctrl.getQuestion);
router.post('/',             authMiddleware,         ctrl.createQuestion);
router.post('/:id/answers',  authMiddleware,         ctrl.createAnswer);
router.put('/:id/answers/:answerId/accept', authMiddleware, ctrl.acceptAnswer);
router.post('/vote',         authMiddleware,         ctrl.vote);

module.exports = router;
