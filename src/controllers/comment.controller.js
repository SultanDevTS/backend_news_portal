const commentService = require('../services/comment.service');
const { successResponse } = require('../utils/responseFormatter');

const getByArticleId = async (req, res, next) => {
    try {
        const { articleId } = req.params;
        const comments = await commentService.getByArticleId(articleId);
        return successResponse(res, comments);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { articleId, name, content } = req.body;
        const comment = await commentService.create({ articleId, name, content });
        return successResponse(res, comment, 201);
    } catch (error) {
        next(error);
    }
};

module.exports = { getByArticleId, create };
