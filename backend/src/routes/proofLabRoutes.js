const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/proofLabController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

function optAuth(req, res, next) {
  const h = req.headers.authorization;
  if (h) { try { const { id } = require('jsonwebtoken').verify(h.split(' ')[1], process.env.JWT_SECRET); req.userId = id; } catch {} }
  next();
}

router.get('/',                         optAuth, ctrl.listChallenges);
router.get('/my',       authMiddleware,          ctrl.getMySubmissions);
router.get('/:id',                      optAuth, ctrl.getChallenge);
router.post('/:id/submit', authMiddleware,        ctrl.submit);

// Admin
router.post('/admin/create',                         authMiddleware, adminMiddleware, ctrl.adminCreate);
router.put('/admin/submissions/:submissionId/review', authMiddleware, adminMiddleware, ctrl.adminReviewSubmission);

module.exports = router;
