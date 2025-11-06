const { executeQuery } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const getVigencias = async (req, res) => {
    try {
        const { estado, clienteId, productoId, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let params = { limit, offset };

        if (estado) {
            whereClause += ' AND v.Estado = @estado';
            params.estado = estado;
        }

        if (clienteId) {
            whereClause += ' AND cp.ClienteId = @clienteId';
            params.clienteId = clienteId;
        }

        if (productoId) {
            whereClause += ' AND cp.ProductoId = @productoId';
            params.productoId = productoId;
        }

        const vigencias = await executeQuery(`
            SELECT 
                v.Id,
                v.ClienteProductoId,
                c.Id AS ClienteId,
                c.Nombre AS ClienteNombre,
                p.Id AS ProductoId,
                p.Nombre AS ProductoNombre,
                v.FechaInicio,
                v.FechaCaducidad,
                DATEDIFF(DAY, GETDATE(), v.FechaCaducidad) AS DiasRestantes,
                v.Periodicidad,
                v.UmbralVerde,
                v.UmbralAmarillo,
                v.UmbralRojo,
                v.Estado,
                v.NotificacionesActivas,
                v.Notas,
                v.FechaCreacion,
                v.FechaActualizacion,
                uc.NombreCompleto AS CreadoPorNombre,
                ua.NombreCompleto AS ActualizadoPorNombre
            FROM Vigencias v
            INNER JOIN ClienteProductos cp ON v.ClienteProductoId = cp.Id
            INNER JOIN Clientes c ON cp.ClienteId = c.Id
            INNER JOIN Productos p ON cp.ProductoId = p.Id
            LEFT JOIN Usuarios uc ON v.CreadoPor = uc.Id
            LEFT JOIN Usuarios ua ON v.ActualizadoPor = ua.Id
            ${whereClause}
            ORDER BY v.FechaCaducidad ASC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `, params);

        const totalResult = await executeQuery(`
            SELECT COUNT(*) as Total 
            FROM Vigencias v
            INNER JOIN ClienteProductos cp ON v.ClienteProductoId = cp.Id
            ${whereClause}
        `, params);

        res.json(successResponse({
            vigencias,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].Total
            }
        }));

    } catch (error) {
        console.error('Error obteniendo vigencias:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const createVigencia = async (req, res) => {
    try {
        const {
            clienteProductoId,
            fechaInicio,
            fechaCaducidad,
            periodicidad,
            umbralVerde = 90,
            umbralAmarillo = 30,
            umbralRojo = 15,
            estado = 'activo',
            notificacionesActivas = true,
            notas
        } = req.body;

        if (!clienteProductoId || !fechaInicio || !fechaCaducidad) {
            return res.status(400).json(errorResponse('ClienteProductoId, FechaInicio y FechaCaducidad son requeridos'));
        }

        if (new Date(fechaCaducidad) <= new Date(fechaInicio)) {
            return res.status(400).json(errorResponse('La fecha de caducidad debe ser posterior a la fecha de inicio'));
        }

        const result = await executeQuery(`
            INSERT INTO Vigencias (
                ClienteProductoId, FechaInicio, FechaCaducidad, Periodicidad,
                UmbralVerde, UmbralAmarillo, UmbralRojo, Estado,
                NotificacionesActivas, Notas, CreadoPor
            )
            OUTPUT INSERTED.Id
            VALUES (
                @clienteProductoId, @fechaInicio, @fechaCaducidad, @periodicidad,
                @umbralVerde, @umbralAmarillo, @umbralRojo, @estado,
                @notificacionesActivas, @notas, @creadoPor
            )
        `, {
            clienteProductoId,
            fechaInicio,
            fechaCaducidad,
            periodicidad,
            umbralVerde,
            umbralAmarillo,
            umbralRojo,
            estado,
            notificacionesActivas,
            notas,
            creadoPor: req.user.id
        });

        res.status(201).json(successResponse(
            { id: result[0].Id },
            'Vigencia creada exitosamente'
        ));

    } catch (error) {
        console.error('Error creando vigencia:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const updateVigencia = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fechaInicio,
            fechaCaducidad,
            periodicidad,
            umbralVerde,
            umbralAmarillo,
            umbralRojo,
            estado,
            notificacionesActivas,
            notas
        } = req.body;

        const existingVigencia = await executeQuery(
            'SELECT Id FROM Vigencias WHERE Id = @id',
            { id }
        );

        if (existingVigencia.length === 0) {
            return res.status(404).json(errorResponse('Vigencia no encontrada'));
        }

        if (fechaCaducidad && fechaInicio && new Date(fechaCaducidad) <= new Date(fechaInicio)) {
            return res.status(400).json(errorResponse('La fecha de caducidad debe ser posterior a la fecha de inicio'));
        }

        let updateFields = [];
        let params = { id, actualizadoPor: req.user.id };

        if (fechaInicio) {
            updateFields.push('FechaInicio = @fechaInicio');
            params.fechaInicio = fechaInicio;
        }
        if (fechaCaducidad) {
            updateFields.push('FechaCaducidad = @fechaCaducidad');
            params.fechaCaducidad = fechaCaducidad;
        }
        if (periodicidad) {
            updateFields.push('Periodicidad = @periodicidad');
            params.periodicidad = periodicidad;
        }
        if (umbralVerde !== undefined) {
            updateFields.push('UmbralVerde = @umbralVerde');
            params.umbralVerde = umbralVerde;
        }
        if (umbralAmarillo !== undefined) {
            updateFields.push('UmbralAmarillo = @umbralAmarillo');
            params.umbralAmarillo = umbralAmarillo;
        }
        if (umbralRojo !== undefined) {
            updateFields.push('UmbralRojo = @umbralRojo');
            params.umbralRojo = umbralRojo;
        }
        if (estado) {
            updateFields.push('Estado = @estado');
            params.estado = estado;
        }
        if (notificacionesActivas !== undefined) {
            updateFields.push('NotificacionesActivas = @notificacionesActivas');
            params.notificacionesActivas = notificacionesActivas;
        }
        if (notas !== undefined) {
            updateFields.push('Notas = @notas');
            params.notas = notas;
        }

        if (updateFields.length === 0) {
            return res.status(400).json(errorResponse('No hay campos para actualizar'));
        }

        updateFields.push('FechaActualizacion = GETDATE()');
        updateFields.push('ActualizadoPor = @actualizadoPor');

        const query = `UPDATE Vigencias SET ${updateFields.join(', ')} WHERE Id = @id`;
        await executeQuery(query, params);

        res.json(successResponse(null, 'Vigencia actualizada exitosamente'));

    } catch (error) {
        console.error('Error actualizando vigencia:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const deleteVigencia = async (req, res) => {
    try {
        const { id } = req.params;

        await executeQuery('DELETE FROM Vigencias WHERE Id = @id', { id });

        res.json(successResponse(null, 'Vigencia eliminada exitosamente'));

    } catch (error) {
        console.error('Error eliminando vigencia:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

module.exports = {
    getVigencias,
    createVigencia,
    updateVigencia,
    deleteVigencia
};