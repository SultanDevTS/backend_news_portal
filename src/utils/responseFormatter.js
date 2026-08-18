const successResponse = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
    });
};

const paginatedResponse = (res, data, meta, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        meta
    });
};

const errorResponse = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = { successResponse, paginatedResponse, errorResponse }