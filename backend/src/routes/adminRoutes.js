const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Todas as rotas exigem login + role admin
router.use(authMiddleware, adminMiddleware);

router.get('/stats',                    ctrl.stats);
router.get('/users',                    ctrl.listUsers);
router.put('/users/:id/password',       ctrl.changePassword);
router.put('/users/:id/role',           ctrl.changeRole);
router.put('/users/:id/badge',          ctrl.setBadge);
router.delete('/users/:id/badge',       ctrl.removeBadge);
router.put('/users/:id/active',         ctrl.toggleActive);
router.delete('/users/:id',             ctrl.deleteUser);
router.get('/posts',                    ctrl.listPosts);
router.delete('/posts/:id',             ctrl.deletePost);

module.exports = router;
