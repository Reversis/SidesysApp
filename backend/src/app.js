const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const exportRoutes = require('./routes/export_routes');
const diagnosticRoutes = require('./routes/diagnostic_routes');

// Importar rutas
const authRoutes = require('./routes/auth_routes');
const usuariosRoutes = require('./routes/usuarios_routes');
const clientesRoutes = require('./routes/clientes_routes');
const productosRoutes = require('./routes/productos_routes');
const vigenciasRoutes = require('./routes/vigencias_routes');
const dashboardRoutes = require('./routes/dashboard_routes');
const configuracionRoutes = require('./routes/configuracion_routes');

const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 requests por ventana
});
app.use(limiter);

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/vigencias', vigenciasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/configuracion', configuracionRoutes);
// Ruta api de desarrollo
app.use('/api/diagnostic', diagnosticRoutes);

// Ruta para servir el frontend (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

module.exports = app;