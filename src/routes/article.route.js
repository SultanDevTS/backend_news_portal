const express = require('express')
const router = express.Router()
const articleController = require('../controllers/article.controller');
const likeController = require('../controllers/like.controller');
const { writeLimiter } = require('../middlewares/rateLimiter');

router.get('/', articleController.getAll);
router.get('/:slug', articleController.getBySlug);

// POST /api/articles/:id/like — Like an article (rate limited)
router.post('/:id/like', writeLimiter, likeController.likeArticle);

module.exports = router;