const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.post('/verify', gameController.verifySubmission);

module.exports = router;
