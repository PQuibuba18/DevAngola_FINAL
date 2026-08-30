const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/mentorController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/',                     ctrl.getAll);
router.post('/register',            authMiddleware, ctrl.register);
router.put('/availability',         authMiddleware, ctrl.toggleAvailability);
router.get('/requests',             authMiddleware, ctrl.getRequests);
router.put('/requests/:id',         authMiddleware, ctrl.updateRequest);
router.post('/:mentorId/request',   authMiddleware, ctrl.request);

module.exports = router;
