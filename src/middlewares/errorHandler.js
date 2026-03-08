const { errorResponse } = require('../utils/responseFormatter')

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Error untuk service dan controller
    if (err.statusCode) {
        return errorResponse(res, err.message, err.statusCode);
    }

    if (err.code === 'P2025') {
        return errorResponse(res, 'Data not found', 404)
    }

    return errorResponse(res, 'Internal server error', 500)
};

module.exports = errorHandler;