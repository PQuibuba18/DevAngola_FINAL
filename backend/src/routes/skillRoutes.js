const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/skillController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/list',                        ctrl.listValid);
router.get('/profile/:userId',             ctrl.getPublicProfile);
router.get('/my',        authMiddleware,   ctrl.getMySkills);
router.post('/my',       authMiddleware,   ctrl.setSkill);
router.delete('/my/:skill', authMiddleware, ctrl.removeSkill);

module.exports = router;
