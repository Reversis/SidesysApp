const { executeQuery } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { hashPassword } = require('../utils/password');

const getUsuarios = async (req, res) => {
    try {
        const usuarios = await executeQuery(`
            SELECT Id, Email, NombreCompleto, Rol, Activo, FechaCreacion 
            FROM Usuarios 
            ORDER BY NombreCompleto
        `);
        res.json(successResponse(usuarios));
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const createUsuario = async (req, res) => {
    try {
        const { email, password, nombreCompleto, rol } = req.body;

        if (!email || !password || !nombreCompleto || !rol) {
            return res.status(400).json(errorResponse('Todos los campos son requeridos'));
        }

        const existingUser = await executeQuery(
            'SELECT Id FROM Usuarios WHERE Email = @email',
            { email }
        );

        if (existingUser.length > 0) {
            return res.status(400).json(errorResponse('El email ya está registrado'));
        }

        const passwordHash = await hashPassword(password);

        const result = await executeQuery(`
            INSERT INTO Usuarios (Email, PasswordHash, NombreCompleto, Rol, CreadoPor)
            OUTPUT INSERTED.Id
            VALUES (@email, @passwordHash, @nombreCompleto, @rol, @creadoPor)
        `, {
            email,
            passwordHash,
            nombreCompleto,
            rol,
            creadoPor: req.user.id
        });

        res.status(201).json(successResponse(
            { id: result[0].Id },
            'Usuario creado exitosamente'
        ));

    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, nombreCompleto, rol, activo } = req.body;

        // Verificar que el usuario existe
        const existingUser = await executeQuery(
            'SELECT Id FROM Usuarios WHERE Id = @id',
            { id }
        );

        if (existingUser.length === 0) {
            return res.status(404).json(errorResponse('Usuario no encontrado'));
        }

        // Verificar si el email ya está en uso por otro usuario
        if (email) {
            const emailUser = await executeQuery(
                'SELECT Id FROM Usuarios WHERE Email = @email AND Id != @id',
                { email, id }
            );
            if (emailUser.length > 0) {
                return res.status(400).json(errorResponse('El email ya está en uso por otro usuario'));
            }
        }

        // Construir la consulta dinámicamente
        let updateFields = [];
        let params = { id };

        if (email) {
            updateFields.push('Email = @email');
            params.email = email;
        }
        if (nombreCompleto) {
            updateFields.push('NombreCompleto = @nombreCompleto');
            params.nombreCompleto = nombreCompleto;
        }
        if (rol) {
            updateFields.push('Rol = @rol');
            params.rol = rol;
        }
        if (activo !== undefined) {
            updateFields.push('Activo = @activo');
            params.activo = activo;
        }

        if (updateFields.length === 0) {
            return res.status(400).json(errorResponse('No hay campos para actualizar'));
        }

        const query = `
            UPDATE Usuarios 
            SET ${updateFields.join(', ')} 
            WHERE Id = @id
        `;

        await executeQuery(query, params);

        res.json(successResponse(null, 'Usuario actualizado exitosamente'));

    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminarse a sí mismo
        if (id === req.user.id) {
            return res.status(400).json(errorResponse('No puedes eliminar tu propio usuario'));
        }

        const result = await executeQuery(
            'DELETE FROM Usuarios WHERE Id = @id',
            { id }
        );

        res.json(successResponse(null, 'Usuario eliminado exitosamente'));

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

const toggleUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir desactivarse a sí mismo
        if (id === req.user.id) {
            return res.status(400).json(errorResponse('No puedes desactivar tu propio usuario'));
        }

        const usuario = await executeQuery(
            'SELECT Activo FROM Usuarios WHERE Id = @id',
            { id }
        );

        if (usuario.length === 0) {
            return res.status(404).json(errorResponse('Usuario no encontrado'));
        }

        const nuevoEstado = !usuario[0].Activo;

        await executeQuery(
            'UPDATE Usuarios SET Activo = @activo WHERE Id = @id',
            { id, activo: nuevoEstado }
        );

        res.json(successResponse(
            { activo: nuevoEstado },
            `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`
        ));

    } catch (error) {
        console.error('Error cambiando estado de usuario:', error);
        res.status(500).json(errorResponse('Error interno del servidor'));
    }
};

module.exports = {
    getUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    toggleUsuario
};