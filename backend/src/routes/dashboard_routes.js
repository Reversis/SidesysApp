const express = require('express');
const { getStats, getProximas } = require('../controllers/dashboard_controller');
const authenticate = require('../middlewares/auth');
const { canRead } = require('../middlewares/authorize');

const router = express.Router();

// Todos los roles autenticados pueden ver el dashboard
router.get('/stats', authenticate, canRead, getStats);
router.get('/proximas', authenticate, canRead, getProximas);

module.exports = router;