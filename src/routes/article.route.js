const express = require('express')
const router = express.Router()
const articleController = require('../controllers/Article.controller');
const likeController = require('../controllers/like.controller');

router.get('/', articleController.getAll);
router.get('/:slug', articleController.getBySlug);

// POST /api/articles/:id/like — Like an article
router.post('/:id/like', likeController.likeArticle);

module.exports = router;