const { executeQuery } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const getAlertas = async (req, res) => {
    try {
        const alertas = await executeQuery(`
            SELECT TOP 1 
                Id, EmailActivo, EmailsDestinatarios, TeamsActivo, TeamsWebhook,
                FrecuenciaCritico, FrecuenciaAdvertencia, FrecuenciaProximo,
                FechaActualizacion, ActualizadoPor
            FROM ConfiguracionAlertas
            ORDER BY FechaActualizacion DESC
        `);

        if (alertas.length === 0) {
            return res.status(404).json(errorResponse('Configuración no encontrada'));
        }

        // Parsear JSON de emails destinatarios
        const config = alertas[0];
        if (config.EmailsDestinatarios) {
            config.EmailsDestinatarios = JSON.parse(config.EmailsDestinatarios);
        }

        res.json(successResponse(config));

    } catch (error) {
        console.error('Error obteniendo configuración de alertas:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const updateAlertas = async (req, res) => {
    try {
        const {
            emailActivo,
            emailsDestinatarios,
            teamsActivo,
            teamsWebhook,
            frecuenciaCritico,
            frecuenciaAdvertencia,
            frecuenciaProximo
        } = req.body;

        // Verificar si ya existe configuración
        const existingConfig = await executeQuery('SELECT TOP 1 Id FROM ConfiguracionAlertas');

        let result;
        if (existingConfig.length > 0) {
            // Actualizar configuración existente
            result = await executeQuery(`
                UPDATE ConfiguracionAlertas 
                SET EmailActivo = @emailActivo,
                    EmailsDestinatarios = @emailsDestinatarios,
                    TeamsActivo = @teamsActivo,
                    TeamsWebhook = @teamsWebhook,
                    FrecuenciaCritico = @frecuenciaCritico,
                    FrecuenciaAdvertencia = @frecuenciaAdvertencia,
                    FrecuenciaProximo = @frecuenciaProximo,
                    FechaActualizacion = GETDATE(),
                    ActualizadoPor = @actualizadoPor
                OUTPUT INSERTED.Id
            `, {
                emailActivo,
                emailsDestinatarios: JSON.stringify(emailsDestinatarios),
                teamsActivo,
                teamsWebhook,
                frecuenciaCritico,
                frecuenciaAdvertencia,
                frecuenciaProximo,
                actualizadoPor: req.user.id
            });
        } else {
            // Insertar nueva configuración
            result = await executeQuery(`
                INSERT INTO ConfiguracionAlertas (
                    EmailActivo, EmailsDestinatarios, TeamsActivo, TeamsWebhook,
                    FrecuenciaCritico, FrecuenciaAdvertencia, FrecuenciaProximo,
                    ActualizadoPor
                )
                OUTPUT INSERTED.Id
                VALUES (
                    @emailActivo, @emailsDestinatarios, @teamsActivo, @teamsWebhook,
                    @frecuenciaCritico, @frecuenciaAdvertencia, @frecuenciaProximo,
                    @actualizadoPor
                )
            `, {
                emailActivo,
                emailsDestinatarios: JSON.stringify(emailsDestinatarios),
                teamsActivo,
                teamsWebhook,
                frecuenciaCritico,
                frecuenciaAdvertencia,
                frecuenciaProximo,
                actualizadoPor: req.user.id
            });
        }

        res.json(successResponse(
            { id: result[0].Id },
            'Configuración de alertas actualizada exitosamente'
        ));

    } catch (error) {
        console.error('Error actualizando configuración de alertas:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

module.exports = {
    getAlertas,
    updateAlertas
};