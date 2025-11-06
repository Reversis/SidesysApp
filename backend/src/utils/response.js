const successResponse = (data, message = 'Operación exitosa') => {
    return {
        success: true,
        message,
        data
    };
};

const errorResponse = (message = 'Error en la operación', errors = null) => {
    return {
        success: false,
        message,
        errors
    };
};

module.exports = {
    successResponse,
    errorResponse
};