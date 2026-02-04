const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/users/enter
router.post('/enter', userController.loginOrRegister);

module.exports = router;