const rateLimit = require('express-rate-limit');

/**
 * General limiter — untuk semua endpoint GET publik.
 * Max 100 request per IP per 1 menit.
 */
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 100,
    standardHeaders: true,  // Return rate limit info via `RateLimit-*` headers
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.',
    },
});

/**
 * Write limiter — untuk POST /comments dan POST /articles/:id/like.
 * Max 10 request per IP per 1 menit (anti-spam).
 */
const writeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.',
    },
});

module.exports = { generalLimiter, writeLimiter };
