const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { writeLimiter } = require('../middlewares/rateLimiter');

// GET /api/comments/:articleId — Get all comments for an article
router.get('/:articleId', commentController.getByArticleId);

// POST /api/comments — Create a new comment (rate limited)
router.post('/', writeLimiter, commentController.create);

module.exports = router;
