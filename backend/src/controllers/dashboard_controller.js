const { executeQuery } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const getStats = async (req, res) => {
    try {
        const stats = await executeQuery(`
            SELECT 
                -- Total de vigencias
                (SELECT COUNT(*) FROM Vigencias WHERE Estado = 'activo') AS TotalVigenciasActivas,
                
                -- Vigencias por estado de color
                (SELECT COUNT(*) FROM VistaVigenciasDashboard WHERE EstadoColor = 'rojo') AS VigenciasRojo,
                (SELECT COUNT(*) FROM VistaVigenciasDashboard WHERE EstadoColor = 'amarillo') AS VigenciasAmarillo,
                (SELECT COUNT(*) FROM VistaVigenciasDashboard WHERE EstadoColor = 'verde') AS VigenciasVerde,
                
                -- Totales generales
                (SELECT COUNT(*) FROM Clientes) AS TotalClientes,
                (SELECT COUNT(*) FROM Productos WHERE Activo = 1) AS TotalProductos,
                
                -- Próximas a vencer (en los próximos 30 días)
                (SELECT COUNT(*) FROM VistaVigenciasDashboard WHERE DiasRestantes BETWEEN 0 AND 30) AS ProximasVencer
        `);

        res.json(successResponse(stats[0]));

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const getProximas = async (req, res) => {
    try {
        const { limite = 10 } = req.query;

        const proximas = await executeQuery(`
            SELECT TOP ${parseInt(limite)}
                ClienteNombre,
                ProductoNombre,
                FechaCaducidad,
                DiasRestantes,
                EstadoColor
            FROM VistaVigenciasDashboard
            WHERE DiasRestantes <= UmbralAmarillo
            ORDER BY DiasRestantes ASC
        `);

        res.json(successResponse(proximas));

    } catch (error) {
        console.error('Error obteniendo vigencias próximas:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

module.exports = {
    getStats,
    getProximas
};