const express   = require('express');
const router    = express.Router();
const ctrl      = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/auth');
const { avatarUpload }   = require('../middlewares/upload');

router.get('/',                                              ctrl.getAll);
router.get('/me',          authMiddleware,                   ctrl.getMe);
router.post('/avatar',     authMiddleware, avatarUpload.single('avatar'), ctrl.uploadAvatar);
router.put('/identifier',  authMiddleware,                   ctrl.updateIdentifier);
router.put('/preferences', authMiddleware,                   ctrl.updatePreferences);
router.get('/:id',                                           ctrl.getOne);
router.get('/:id/followers',                                 ctrl.getFollowers);
router.get('/:id/following',                                 ctrl.getFollowing);
router.post('/:id/follow', authMiddleware,                   ctrl.toggleFollow);

module.exports = router;
