const express = require('express');
const { executeQuery } = require('../config/database');
const router = express.Router();

// Endpoint de diagnóstico
router.get('/', async (req, res) => {
    try {
        const results = {
            database: {},
            environment: {},
            tables: {}
        };

        // Verificar conexión a la base de datos
        try {
            const dbResult = await executeQuery('SELECT DB_NAME() as dbname, @@VERSION as version');
            results.database = dbResult[0];
            results.database.connected = true;
        } catch (dbError) {
            results.database.connected = false;
            results.database.error = dbError.message;
        }

        // Verificar variables de entorno
        results.environment = {
            NODE_ENV: process.env.NODE_ENV,
            DB_SERVER: process.env.DB_SERVER,
            DB_DATABASE: process.env.DB_DATABASE,
            DB_USER: process.env.DB_USER,
            JWT_SECRET: process.env.JWT_SECRET ? 'Configurado' : 'No configurado'
        };

        // Verificar tablas
        if (results.database.connected) {
            try {
                const tables = await executeQuery(`
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_TYPE = 'BASE TABLE'
                    AND TABLE_CATALOG = 'sidesys_vigencias'
                `);
                results.tables = tables;
            } catch (tableError) {
                results.tables.error = tableError.message;
            }
        }

        res.json({
            success: true,
            diagnostic: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;