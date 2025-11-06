const express = require('express');
const { getAlertas, updateAlertas } = require('../controllers/configuracion_controller');
const authenticate = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

router.get('/alertas', authenticate, authorize('STAC'), getAlertas);
router.put('/alertas', authenticate, authorize('STAC'), updateAlertas);

module.exports = router;