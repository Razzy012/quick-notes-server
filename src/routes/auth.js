const express = require('express');
const router = express.Router();
const controlers = require('../controllers');

router.post('/signup', controlers.auth.signup);
router.post('/login', controlers.auth.login);
router.post('/logout', controlers.auth.logout);
router.post('/logoutAll', controlers.auth.logoutAll);
router.post('/accessToken', controlers.auth.newAccessToken);
router.post('/refreshToken', controlers.auth.newRefreshToken);

module.exports = router;