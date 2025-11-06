const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'No autorizado. Usuario no autenticado.' 
            });
        }

        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ 
                success: false, 
                message: `Prohibido. Rol '${req.user.rol}' no tiene permisos para esta acción.` 
            });
        }

        next();
    };
};

// Middleware específico para permisos de lectura
const canRead = (req, res, next) => {
    const allowedRoles = ['STAC', 'PROYECTO', 'COMERCIAL', 'SYSTEM'];
    return authorize(...allowedRoles)(req, res, next);
};

// Middleware específico para permisos de edición limitada
const canEditLimited = (req, res, next) => {
    const allowedRoles = ['STAC', 'PROYECTO'];
    return authorize(...allowedRoles)(req, res, next);
};

// Middleware específico para permisos completos
const canEditAll = (req, res, next) => {
    const allowedRoles = ['STAC'];
    return authorize(...allowedRoles)(req, res, next);
};

module.exports = {
    authorize,
    canRead,
    canEditLimited,
    canEditAll
};