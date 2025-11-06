const { executeQuery } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

const getProductos = async (req, res) => {
    try {
        const productos = await executeQuery(`
            SELECT Id, Nombre, Descripcion, Tipo, Activo, FechaCreacion 
            FROM Productos 
            ORDER BY Nombre
        `);
        res.json(successResponse(productos));
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const createProducto = async (req, res) => {
    try {
        const { nombre, descripcion, tipo } = req.body;

        if (!nombre) {
            return res.status(400).json(errorResponse('El nombre es requerido'));
        }

        const existingProduct = await executeQuery(
            'SELECT Id FROM Productos WHERE Nombre = @nombre',
            { nombre }
        );

        if (existingProduct.length > 0) {
            return res.status(400).json(errorResponse('Ya existe un producto con ese nombre'));
        }

        const result = await executeQuery(`
            INSERT INTO Productos (Nombre, Descripcion, Tipo)
            OUTPUT INSERTED.Id
            VALUES (@nombre, @descripcion, @tipo)
        `, {
            nombre,
            descripcion,
            tipo
        });

        res.status(201).json(successResponse(
            { id: result[0].Id },
            'Producto creado exitosamente'
        ));

    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, tipo, activo } = req.body;

        const existingProduct = await executeQuery(
            'SELECT Id FROM Productos WHERE Id = @id',
            { id }
        );

        if (existingProduct.length === 0) {
            return res.status(404).json(errorResponse('Producto no encontrado'));
        }

        if (nombre) {
            const nombreProduct = await executeQuery(
                'SELECT Id FROM Productos WHERE Nombre = @nombre AND Id != @id',
                { nombre, id }
            );
            if (nombreProduct.length > 0) {
                return res.status(400).json(errorResponse('Ya existe un producto con ese nombre'));
            }
        }

        let updateFields = [];
        let params = { id };

        if (nombre) {
            updateFields.push('Nombre = @nombre');
            params.nombre = nombre;
        }
        if (descripcion) {
            updateFields.push('Descripcion = @descripcion');
            params.descripcion = descripcion;
        }
        if (tipo) {
            updateFields.push('Tipo = @tipo');
            params.tipo = tipo;
        }
        if (activo !== undefined) {
            updateFields.push('Activo = @activo');
            params.activo = activo;
        }

        if (updateFields.length === 0) {
            return res.status(400).json(errorResponse('No hay campos para actualizar'));
        }

        const query = `UPDATE Productos SET ${updateFields.join(', ')} WHERE Id = @id`;
        await executeQuery(query, params);

        res.json(successResponse(null, 'Producto actualizado exitosamente'));

    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el producto está en uso
        const enUso = await executeQuery(
            'SELECT TOP 1 Id FROM ClienteProductos WHERE ProductoId = @id',
            { id }
        );

        if (enUso.length > 0) {
            return res.status(400).json(errorResponse('No se puede eliminar el producto porque está asociado a clientes'));
        }

        await executeQuery('DELETE FROM Productos WHERE Id = @id', { id });

        res.json(successResponse(null, 'Producto eliminado exitosamente'));

    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

module.exports = {
    getProductos,
    createProducto,
    updateProducto,
    deleteProducto
};