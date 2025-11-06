const { executeQuery } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const getClientes = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = { limit, offset };

        if (search) {
            whereClause = 'WHERE c.Nombre LIKE @search OR c.Email LIKE @search';
            params.search = `%${search}%`;
        }

        const clientes = await executeQuery(`
            SELECT 
                c.Id, c.Nombre, c.Email, c.Telefono, c.Direccion,
                c.ContactoPrincipal, c.Descripcion, c.SystemInformationUrl,
                c.FechaCreacion, c.FechaActualizacion,
                u.NombreCompleto AS CreadoPorNombre
            FROM Clientes c
            LEFT JOIN Usuarios u ON c.CreadoPor = u.Id
            ${whereClause}
            ORDER BY c.Nombre
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `, params);

        const totalResult = await executeQuery(`
            SELECT COUNT(*) as Total 
            FROM Clientes c
            ${whereClause}
        `, params);

        res.json(successResponse({
            clientes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].Total
            }
        }));

    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const createCliente = async (req, res) => {
    try {
        const { 
            nombre, email, telefono, direccion, 
            contactoPrincipal, descripcion, systemInformationUrl 
        } = req.body;

        if (!nombre) {
            return res.status(400).json(errorResponse('El nombre es requerido'));
        }

        const result = await executeQuery(`
            INSERT INTO Clientes (Nombre, Email, Telefono, Direccion, ContactoPrincipal, Descripcion, SystemInformationUrl, CreadoPor)
            OUTPUT INSERTED.Id
            VALUES (@nombre, @email, @telefono, @direccion, @contactoPrincipal, @descripcion, @systemInformationUrl, @creadoPor)
        `, {
            nombre,
            email,
            telefono,
            direccion,
            contactoPrincipal,
            descripcion,
            systemInformationUrl,
            creadoPor: req.user.id
        });

        res.status(201).json(successResponse(
            { id: result[0].Id },
            'Cliente creado exitosamente'
        ));

    } catch (error) {
        console.error('Error creando cliente:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nombre, email, telefono, direccion, 
            contactoPrincipal, descripcion, systemInformationUrl 
        } = req.body;

        const existingCliente = await executeQuery(
            'SELECT Id FROM Clientes WHERE Id = @id',
            { id }
        );

        if (existingCliente.length === 0) {
            return res.status(404).json(errorResponse('Cliente no encontrado'));
        }

        await executeQuery(`
            UPDATE Clientes 
            SET Nombre = @nombre, Email = @email, Telefono = @telefono,
                Direccion = @direccion, ContactoPrincipal = @contactoPrincipal,
                Descripcion = @descripcion, SystemInformationUrl = @systemInformationUrl,
                FechaActualizacion = GETDATE()
            WHERE Id = @id
        `, {
            id,
            nombre,
            email,
            telefono,
            direccion,
            contactoPrincipal,
            descripcion,
            systemInformationUrl
        });

        res.json(successResponse(null, 'Cliente actualizado exitosamente'));

    } catch (error) {
        console.error('Error actualizando cliente:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;

        await executeQuery('DELETE FROM Clientes WHERE Id = @id', { id });

        res.json(successResponse(null, 'Cliente eliminado exitosamente'));

    } catch (error) {
        console.error('Error eliminando cliente:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const getClienteProductos = async (req, res) => {
    try {
        const { id } = req.params;

        const productos = await executeQuery(`
            SELECT 
                cp.Id,
                p.Id AS ProductoId,
                p.Nombre AS ProductoNombre,
                p.Descripcion AS ProductoDescripcion,
                cp.CantidadLicencias,
                cp.FechaAdquisicion,
                cp.Notas,
                cp.FechaCreacion
            FROM ClienteProductos cp
            INNER JOIN Productos p ON cp.ProductoId = p.Id
            WHERE cp.ClienteId = @id
            ORDER BY p.Nombre
        `, { id });

        res.json(successResponse(productos));

    } catch (error) {
        console.error('Error obteniendo productos del cliente:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const addClienteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { productoId, cantidadLicencias, fechaAdquisicion, notas } = req.body;

        // Verificar si ya existe la relación
        const existing = await executeQuery(
            'SELECT Id FROM ClienteProductos WHERE ClienteId = @clienteId AND ProductoId = @productoId',
            { clienteId: id, productoId }
        );

        if (existing.length > 0) {
            return res.status(400).json(errorResponse('El cliente ya tiene este producto asociado'));
        }

        const result = await executeQuery(`
            INSERT INTO ClienteProductos (ClienteId, ProductoId, CantidadLicencias, FechaAdquisicion, Notas)
            OUTPUT INSERTED.Id
            VALUES (@clienteId, @productoId, @cantidadLicencias, @fechaAdquisicion, @notas)
        `, {
            clienteId: id,
            productoId,
            cantidadLicencias,
            fechaAdquisicion,
            notas
        });

        res.status(201).json(successResponse(
            { id: result[0].Id },
            'Producto agregado al cliente exitosamente'
        ));

    } catch (error) {
        console.error('Error agregando producto al cliente:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const removeClienteProducto = async (req, res) => {
    try {
        const { cId, pId } = req.params;

        await executeQuery(
            'DELETE FROM ClienteProductos WHERE ClienteId = @clienteId AND ProductoId = @productoId',
            { clienteId: cId, productoId: pId }
        );

        res.json(successResponse(null, 'Producto removido del cliente exitosamente'));

    } catch (error) {
        console.error('Error removiendo producto del cliente:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

module.exports = {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    getClienteProductos,
    addClienteProducto,
    removeClienteProducto
};