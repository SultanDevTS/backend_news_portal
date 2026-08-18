const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');

// GET /api/comments/:articleId — Get all comments for an article
router.get('/:articleId', commentController.getByArticleId);

// POST /api/comments — Create a new comment
router.post('/', commentController.create);

module.exports = router;
