const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/jobController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Middleware opcional: popula req.userId se token válido existir
function optionalAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return next();
  const t = h.split(' ')[1]; if (!t) return next();
  try {
    const { id, role } = require('jsonwebtoken').verify(t, process.env.JWT_SECRET);
    req.userId = id; req.userRole = role || 'user';
  } catch {}
  next();
}

router.get('/',                                    optionalAuth, ctrl.getAll);
router.get('/matching',     authMiddleware,                      ctrl.getMatching);
router.get('/:id',                                 optionalAuth, ctrl.getOne);
router.post('/',            authMiddleware,                      ctrl.create);
router.post('/:id/apply',   authMiddleware,                      ctrl.apply);
router.get('/:id/applications', authMiddleware,                  ctrl.getApplications);
router.put('/applications/:appId', authMiddleware,               ctrl.updateApplicationStatus);

// Admin
router.delete('/:id', authMiddleware, adminMiddleware, ctrl.adminDeactivate);

module.exports = router;
