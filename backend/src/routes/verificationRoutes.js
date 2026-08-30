const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/verificationController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const { fileUpload } = require('../middlewares/upload');

// Utilizador
router.get('/status',     authMiddleware, ctrl.getStatus);
router.post('/submit',    authMiddleware,
  fileUpload.single('document'), ctrl.submit);

// Admin — verificar identidade de outros utilizadores
router.get('/admin/pending',      authMiddleware, adminMiddleware, ctrl.adminList);
router.put('/admin/:id/approve',  authMiddleware, adminMiddleware, ctrl.adminApprove);
router.put('/admin/:id/reject',   authMiddleware, adminMiddleware, ctrl.adminReject);

module.exports = router;
