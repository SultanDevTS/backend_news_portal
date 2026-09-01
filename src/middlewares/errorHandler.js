const { errorResponse } = require('../utils/responseFormatter')

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Error dari service/controller yang sudah punya statusCode
    if (err.statusCode) {
        return errorResponse(res, err.message, err.statusCode);
    }

    // Prisma known error codes
    if (err.code === 'P2025') {
        return errorResponse(res, 'Data not found', 404);
    }

    if (err.code === 'P2002') {
        // Unique constraint violation — misal slug artikel duplikat
        return errorResponse(res, 'Data sudah ada (duplicate)', 409);
    }

    if (err.code === 'P2003') {
        // Foreign key constraint — misal articleId tidak valid
        return errorResponse(res, 'Referensi data tidak valid', 400);
    }

    if (err.code === 'P2000') {
        // Value too long for column
        return errorResponse(res, 'Data terlalu panjang', 400);
    }

    return errorResponse(res, 'Internal server error', 500)
};

module.exports = errorHandler;