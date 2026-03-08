const successResponse = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        succes: true,
        data,
    });
};

const paginatedResponse = (res, data, meta, statusCode = 200) => {
    return res.status(statusCode).json({
        succes: true,
        data,
        meta
    });
};

const errorResponse = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({
        succes: false,
        message
    });
};

module.exports = { successResponse, paginatedResponse, errorResponse }