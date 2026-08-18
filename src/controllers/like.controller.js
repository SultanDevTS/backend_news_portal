const likeService = require('../services/like.service');
const { successResponse } = require('../utils/responseFormatter');

const likeArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Get client IP for deduplication
        const ip = req.headers['x-forwarded-for'] || req.ip || 'anonymous';
        const result = await likeService.toggleLike(id, ip);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

module.exports = { likeArticle };
