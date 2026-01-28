const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { requireAuth, rateLimitMiddleware } = require('../middleware/auth');
const { loginRateLimiter, registerRateLimiter } = require('../utils/auth');

router.post('/register', rateLimitMiddleware(registerRateLimiter), register);
router.post('/login', rateLimitMiddleware(loginRateLimiter), login);
router.get('/me', requireAuth, getMe);

module.exports = router;
