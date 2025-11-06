const { verifyToken } = require('../config/jwt');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'No autorizado. Token no proporcionado.' 
        });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'No autorizado. Token malformado.' 
        });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido o expirado.' 
        });
    }
};

module.exports = authenticate;