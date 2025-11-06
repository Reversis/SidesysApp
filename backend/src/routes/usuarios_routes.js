const express = require('express');
const { getUsuarios, createUsuario, updateUsuario, deleteUsuario, toggleUsuario } = require('../controllers/usuarios_controller');
const authenticate = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

router.get('/', authenticate, authorize('STAC'), getUsuarios);
router.post('/', authenticate, authorize('STAC'), createUsuario);
router.put('/:id', authenticate, authorize('STAC'), updateUsuario);
router.delete('/:id', authenticate, authorize('STAC'), deleteUsuario);
router.patch('/:id/toggle', authenticate, authorize('STAC'), toggleUsuario);

module.exports = router;