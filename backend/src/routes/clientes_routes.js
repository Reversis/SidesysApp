const express = require('express');
const { 
    getClientes, 
    createCliente, 
    updateCliente, 
    deleteCliente, 
    getClienteProductos, 
    addClienteProducto, 
    removeClienteProducto 
} = require('../controllers/clientes_controller');
const authenticate = require('../middlewares/auth');
const { canRead, canEditAll } = require('../middlewares/authorize');

const router = express.Router();

// Todos los roles autenticados pueden ver clientes
router.get('/', authenticate, canRead, getClientes);

// Solo STAC puede crear, editar y eliminar clientes
router.post('/', authenticate, canEditAll, createCliente);
router.put('/:id', authenticate, canEditAll, updateCliente);
router.delete('/:id', authenticate, canEditAll, deleteCliente);

// Todos pueden ver productos del cliente
router.get('/:id/productos', authenticate, canRead, getClienteProductos);

// Solo STAC puede gestionar productos de clientes
router.post('/:id/productos', authenticate, canEditAll, addClienteProducto);
router.delete('/:cId/productos/:pId', authenticate, canEditAll, removeClienteProducto);

module.exports = router;