const express = require('express')
const cors = require('cors')
const errorHandler = require('./middlewares/errorHandler')
const routes = require('./routes/index')

const app = express()

// Parse allowed origins from comma-separated env variable
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. server-to-server, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: Origin "${origin}" not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}))

app.use(express.json())

// Health check — for load balancer / uptime monitoring
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes)

// tangkap route yang tidak dikenal
app.use((req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`)
    error.statusCode = 404;
    next(error)
})

app.use(errorHandler)


module.exports = app
