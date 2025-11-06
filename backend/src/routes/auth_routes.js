const express = require('express');
const { devLogin, devDiagnostic } = require('../controllers/auth_dev');
const { login, register, getMe } = require('../controllers/auth_controller');
const authenticate = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

router.post('/login', login);
router.post('/register', authenticate, authorize('STAC'), register);
router.get('/me', authenticate, getMe);

//Rutas de desarrollo
router.post('/login-dev', devLogin);
router.get('/dev-diagnostic', devDiagnostic);

module.exports = router;