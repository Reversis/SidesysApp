const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
};

console.log('🔑 JWT Config loaded:', {
    hasSecret: !!JWT_CONFIG.secret,
    expiresIn: JWT_CONFIG.expiresIn
});

const generateToken = (payload) => {
    try {
        console.log('🎫 Generating token for:', payload.email);
        const token = jwt.sign(payload, JWT_CONFIG.secret, {
            expiresIn: JWT_CONFIG.expiresIn
        });
        console.log('✅ Token generated successfully');
        return token;
    } catch (error) {
        console.error('❌ Error generating token:', error);
        throw new Error('Error generando token JWT');
    }
};

const verifyToken = (token) => {
    try {
        console.log('🔍 Verifying token...');
        const decoded = jwt.verify(token, JWT_CONFIG.secret);
        console.log('✅ Token verified successfully for:', decoded.email);
        return decoded;
    } catch (error) {
        console.error('❌ Error verifying token:', error.message);
        throw new Error('Token inválido o expirado');
    }
};

const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    JWT_CONFIG
};