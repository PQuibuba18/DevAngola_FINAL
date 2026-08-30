const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/projectController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/',                        ctrl.getAll);
router.get('/:id',                     ctrl.getOne);
router.post('/',         authMiddleware, ctrl.create);
router.post('/:id/apply', authMiddleware, ctrl.apply);
router.put('/:id/status', authMiddleware, ctrl.updateStatus);
router.put('/applications/:applicationId/accept', authMiddleware, ctrl.acceptApplication);

module.exports = router;
