const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/workExchangeController');
const { authMiddleware } = require('../middlewares/auth');

function optAuth(req, res, next) {
  const h = req.headers.authorization;
  if (h) { try { const { id } = require('jsonwebtoken').verify(h.split(' ')[1], process.env.JWT_SECRET); req.userId = id; } catch {} }
  next();
}

router.get('/',                                    optAuth, ctrl.listProjects);
router.get('/:id',                                 optAuth, ctrl.getProject);
router.post('/',                    authMiddleware,          ctrl.createProject);
router.post('/:id/proposal',        authMiddleware,          ctrl.submitProposal);
router.put('/proposals/:proposalId/accept', authMiddleware,  ctrl.acceptProposal);
router.post('/:id/milestone',       authMiddleware,          ctrl.addMilestone);
router.put('/:id/milestone/:milestoneId',   authMiddleware,  ctrl.updateMilestoneStatus);
router.post('/:id/review',          authMiddleware,          ctrl.addReview);

module.exports = router;
