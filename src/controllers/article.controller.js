const articleService = require('../services/article.service');
const { successResponse, paginatedResponse } = require('../utils/responseFormatter');

const getAll = async (req, res, next) => {
    try {
        const { page, limit, search, category } = req.query;
        const { articles, meta } = await articleService.getAll({ page, limit, search, category });
        return paginatedResponse(res, articles, meta);
    } catch (error) {
        next(error);
    }
};

const getBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const article = await articleService.getBySlug(slug);
        return successResponse(res, article);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAll, getBySlug };
