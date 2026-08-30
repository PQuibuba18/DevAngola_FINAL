const express   = require('express');
const router    = express.Router();
const auth      = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const { portfolioUpload } = require('../middlewares/upload');

router.post('/register', portfolioUpload.single('portfolio'), auth.register);
router.post('/login',    auth.login);
router.post('/refresh',  authMiddleware, auth.refresh);

module.exports = router;
