const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/startupsController');
const { authMiddleware } = require('../middlewares/auth');

function optAuth(req, res, next) {
  const h = req.headers.authorization;
  if (h) { try { const { id } = require('jsonwebtoken').verify(h.split(' ')[1], process.env.JWT_SECRET); req.userId = id; } catch {} }
  next();
}

// Startups
router.get('/',               optAuth, ctrl.list);
router.get('/:id',            optAuth, ctrl.getOne);
router.post('/',  authMiddleware,       ctrl.create);

// Funding
router.get('/funding/list',          optAuth, ctrl.listFunding);
router.post('/funding', authMiddleware,        ctrl.createFunding);

// Founder Match
router.get('/matches/my',     authMiddleware, ctrl.getMyMatches);
router.post('/match/:targetId', authMiddleware, ctrl.requestMatch);
router.put('/match/:id',      authMiddleware, ctrl.respondMatch);

module.exports = router;
