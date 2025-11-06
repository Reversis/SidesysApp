const express = require('express');
const { getVigencias, createVigencia, updateVigencia, deleteVigencia } = require('../controllers/vigencia_controller');
const authenticate = require('../middlewares/auth');
const { canRead, canEditLimited } = require('../middlewares/authorize');

const router = express.Router();

// Todos los roles autenticados pueden ver vigencias
router.get('/', authenticate, canRead, getVigencias);

// STAC y PROYECTO pueden gestionar vigencias
router.post('/', authenticate, canEditLimited, createVigencia);
router.put('/:id', authenticate, canEditLimited, updateVigencia);
router.delete('/:id', authenticate, canEditLimited, deleteVigencia);

module.exports = router;