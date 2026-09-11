const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/passportController');
const { authMiddleware } = require('../middlewares/auth');

// Público — qualquer pessoa pode ver o passport de qualquer utilizador
router.get('/:userId', ctrl.getPassport);

// Autenticado — o próprio utilizador gere a sua experiência
router.post('/experience',        authMiddleware, ctrl.addExperience);
router.put('/experience/:id',     authMiddleware, ctrl.updateExperience);
router.delete('/experience/:id',  authMiddleware, ctrl.deleteExperience);

// Reviews — utilizador avalia outro
router.post('/review/:revieweeId', authMiddleware, ctrl.addReview);

// Score — recalcula
router.post('/score/compute', authMiddleware, ctrl.computeScore);

module.exports = router;
