const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../config/jwt');
const { executeQuery } = require('../config/database');

const login = async (req, res) => {
    try {
        console.log('📨 Login request body:', req.body);
        const { email, password } = req.body;

        // Validar campos requeridos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario por email - CORREGIR NOMBRE DE TABLA Y CAMPOS
        const user = await executeQuery(
            `SELECT ID, Email, PasswordHash, NombreCompleto, Rol, Activo, FechaCreacion FROM Usuarios WHERE Email = '${email}'`
            
        );

        console.log('👤 Usuario encontrado:', user);

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const userData = user[0];

        // Verificar si el usuario está activo
        if (!userData.Activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await comparePassword(password, userData.PasswordHash);
        console.log('🔐 Contraseña válida:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = generateToken({
            id: userData.ID,
            email: userData.Email,
            rol: userData.Rol
        });

        console.log('✅ Token generado para:', userData.Email);

        // Responder con la estructura que el frontend espera
        res.json({
            success: true,
            data: {
                token: token,
                user: {
                    id: userData.ID,
                    email: userData.Email,
                    nombreCompleto: userData.NombreCompleto,
                    rol: userData.Rol
                }
            },
            message: 'Login exitoso'
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const register = async (req, res) => {
    try {
        const { email, password, nombreCompleto, rol } = req.body;

        if (!email || !password || !nombreCompleto || !rol) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await executeQuery(
            'SELECT ID FROM Usuarios WHERE Email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El usuario ya está registrado'
            });
        }

        // Hash de la contraseña
        const passwordHash = await hashPassword(password);

        // Insertar nuevo usuario
        const result = await executeQuery(
            `INSERT INTO Usuarios (Email, PasswordHash, NombreCompleto, Rol, Activo, FechaCreacion) 
             OUTPUT INSERTED.ID 
             VALUES (?, ?, ?, ?, 1, GETDATE())`,
            [email, passwordHash, nombreCompleto, rol]
        );

        const newUserId = result[0].ID;

        res.status(201).json({
            success: true,
            data: { id: newUserId },
            message: 'Usuario creado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await executeQuery(
            'SELECT ID, Email, NombreCompleto, Rol, Activo, FechaCreacion FROM Usuarios WHERE ID = ?',
            [req.user.id]
        );

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: user[0]
        });

    } catch (error) {
        console.error('❌ Error obteniendo usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    login,
    register,
    getMe
};