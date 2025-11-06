const express = require('express');
const { exportVigencias } = require('../controllers/export_controller');
const authenticate = require('../middlewares/auth');
const { canRead } = require('../middlewares/authorize');

const router = express.Router();

// STAC, PROYECTO y COMERCIAL pueden exportar (SYSTEM no puede)
router.get('/vigencias', authenticate, (req, res, next) => {
    if (req.user.rol === 'SYSTEM') {
        return res.status(403).json({
            success: false,
            message: 'El rol SYSTEM no tiene permisos de exportación'
        });
    }
    next();
}, exportVigencias);

module.exports = router;