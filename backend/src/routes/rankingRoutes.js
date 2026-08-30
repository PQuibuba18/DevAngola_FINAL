// routes/rankingRoutes.js — público, não exige autenticação
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/rankingController');

router.get('/', ctrl.top5);

module.exports = router;
