const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Route to create a new game
// POST /api/game/create
router.post('/create', gameController.createGame);

// Route to join a game
// POST /api/game/join
router.post('/join', gameController.joinGame);

module.exports = router;