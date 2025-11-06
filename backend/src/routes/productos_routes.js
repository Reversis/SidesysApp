const express = require('express');
const { getProductos, createProducto, updateProducto, deleteProducto } = require('../controllers/productos_controller');
const authenticate = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

router.get('/', authenticate, getProductos);
router.post('/', authenticate, authorize('STAC'), createProducto);
router.put('/:id', authenticate, authorize('STAC'), updateProducto);
router.delete('/:id', authenticate, authorize('STAC'), deleteProducto);

module.exports = router;