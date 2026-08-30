const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/quizController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

router.get('/status',          authMiddleware,                       ctrl.status);
router.get('/',                authMiddleware,                       ctrl.getQuestions);
router.post('/submit',         authMiddleware,                       ctrl.submit);
router.get('/admin',           authMiddleware, adminMiddleware,      ctrl.adminList);
router.post('/admin',          authMiddleware, adminMiddleware,      ctrl.adminCreate);
router.delete('/admin/:id',    authMiddleware, adminMiddleware,      ctrl.adminDelete);

module.exports = router;
