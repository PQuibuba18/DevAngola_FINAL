const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/messageController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);
router.get('/',               ctrl.listConversations);
router.get('/unread',         ctrl.unreadCount);
router.post('/start',         ctrl.startConversation);
router.get('/:conversationId', ctrl.getMessages);
router.post('/:conversationId',ctrl.sendMessage);

module.exports = router;
