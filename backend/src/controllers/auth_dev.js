const { generateToken } = require('../config/jwt');
const { executeQuery } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { comparePassword } = require('../utils/password');

const devLogin = async (req, res) => {
    try {
        console.log('🔐 [DEV] Intentando login...', req.body);
        
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json(errorResponse('Email y contraseña son requeridos'));
        }

        // PRIMERO: Intentar con base de datos real
        try {
            console.log('🗃️ [DEV] Intentando con base de datos real...');
            const users = await executeQuery(
                'SELECT Id, Email, PasswordHash, NombreCompleto, Rol, Activo FROM Usuarios WHERE Email = @email',
                { email }
            );

            if (users.length > 0) {
                const user = users[0];
                console.log('👤 [DEV] Usuario encontrado en BD:', user.Email);
                
                if (!user.Activo) {
                    return res.status(401).json(errorResponse('Usuario inactivo'));
                }

                // Verificar contraseña
                const isValid = await comparePassword(password, user.PasswordHash);
                console.log('🔑 [DEV] Resultado verificación contraseña:', isValid);
                
                if (isValid) {
                    const userData = {
                        id: user.Id,
                        email: user.Email,
                        nombreCompleto: user.NombreCompleto,
                        rol: user.Rol
                    };

                    const token = generateToken(userData);

                    return res.json(successResponse({
                        token,
                        user: userData
                    }, 'Login exitoso (con base de datos real)'));
                }
            }
        } catch (dbError) {
            console.log('❌ [DEV] Error con base de datos:', dbError.message);
            // Continuar con método de desarrollo
        }

        // SEGUNDO: Método de desarrollo (fallback)
        console.log('🛠️ [DEV] Usando método de desarrollo...');
        if (email === 'stac@sidesys.com' && password === 'Admin123') {
            const userData = {
                id: '11111111-1111-1111-1111-111111111111',
                email: 'stac@sidesys.com',
                nombreCompleto: 'Usuario STAC Desarrollo',
                rol: 'STAC'
            };

            const token = generateToken(userData);

            return res.json(successResponse({
                token,
                user: userData
            }, 'Login exitoso (modo desarrollo - sin base de datos)'));
        }

        return res.status(401).json(errorResponse('Credenciales inválidas'));

    } catch (error) {
        console.error('❌ [DEV] Error en login:', error);
        res.status(500).json(errorResponse('Error interno: ' + error.message));
    }
};

// Función para diagnosticar problemas
const devDiagnostic = async (req, res) => {
    try {
        const results = {
            jwt: {},
            database: {},
            password: {}
        };

        // Test JWT
        try {
            const testPayload = { test: true };
            const token = generateToken(testPayload);
            results.jwt = { working: true, token: token.substring(0, 20) + '...' };
        } catch (jwtError) {
            results.jwt = { working: false, error: jwtError.message };
        }

        // Test Database
        try {
            const dbTest = await executeQuery('SELECT @@VERSION as version');
            results.database = { connected: true, version: dbTest[0].version };
            
            // Test usuarios
            const users = await executeQuery('SELECT COUNT(*) as count FROM Usuarios');
            results.database.userCount = users[0].count;
            
            // Test usuario específico
            const stacUser = await executeQuery('SELECT Email, Activo FROM Usuarios WHERE Email = @email', { email: 'stac@sidesys.com' });
            results.database.stacUser = stacUser.length > 0 ? stacUser[0] : 'NOT_FOUND';
        } catch (dbError) {
            results.database = { connected: false, error: dbError.message };
        }

        // Test Password
        try {
            const testHash = await require('../utils/password').hashPassword('test');
            const testCompare = await require('../utils/password').comparePassword('test', testHash);
            results.password = { working: true, hashCompare: testCompare };
        } catch (pwdError) {
            results.password = { working: false, error: pwdError.message };
        }

        res.json({
            success: true,
            diagnostic: results,
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                DB_DATABASE: process.env.DB_DATABASE,
                JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET'
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = { 
    devLogin,
    devDiagnostic
};