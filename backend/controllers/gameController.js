const Game = require('../models/Game');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid'); // for generating random string for room id
const axios = require('axios');

exports.verifySubmission = async (req, res) => {
  try {
    const { gameId, userId } = req.body;

    // Fetch Game & User Data
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // if game is already finished, stop. prevents race condition
    if (game.status === 'FINISHED') {
      return res.status(400).json({ message: 'Game already finished', winner: game.winner });
    }

    // Call Codeforces API
    // We fetch the last 10 submissions for this user to save bandwidth
    const cfUrl = `https://codeforces.com/api/user.status?handle=${user.codeforcesHandle}&from=1&count=10`;
    const response = await axios.get(cfUrl);
    
    if (response.data.status !== 'OK') {
      return res.status(502).json({ error: 'Codeforces API Error' });
    }

    const submissions = response.data.result;

    // Find the Winning Submission
    const winningSubmission = submissions.find(sub => {
      
      // Check Problem ID Match (Contest ID + Index)
      const isSameProblem = 
        sub.problem.contestId === game.problem.contestId &&
        sub.problem.index === game.problem.index;

      // Check Verdict
      const isAccepted = sub.verdict === 'OK';

      // Check Time (Anti-Cheat)
      // CF returns time in Seconds. JS Date is in Milliseconds.
      const submissionTime = sub.creationTimeSeconds * 1000;
      const gameStartTime = new Date(game.startTime).getTime();
      
      const isRecent = submissionTime > gameStartTime;

      return isSameProblem && isAccepted && isRecent;
    });

    // Handle Result
    if (winningSubmission) {
      // WINNER FOUND!
      game.status = 'FINISHED';
      game.winner = userId;
      game.endTime = new Date();
      await game.save();

      // Update User Stats (Simple +1 for now)
      await User.findByIdAndUpdate(userId, { $inc: { wins: 1 } });
      
      // OPTIONAL: Update Loser Stats (If you want to track losses)
      const loserId = game.player1.toString() === userId ? game.player2 : game.player1;
      if (loserId) {
        await User.findByIdAndUpdate(loserId, { $inc: { losses: 1 } });
      }

      //update the loser
      const io = req.app.get('io');
      
      // 2. Broadcast event to everyone in this room
      // roomId is stored in the game document
      io.to(game.roomId).emit('game_over', {
        winner: userId,
        message: 'Game Finished!'
      });

      return res.json({ 
        success: true, 
        gameStatus: 'FINISHED', 
        winner: userId 
      });
    } else {
      // No win yet
      return res.json({ 
        success: true, 
        gameStatus: 'IN_PROGRESS', 
        message: 'No valid submission found yet.' 
      });
    }

  } catch (error) {
    console.error('Submission Check Error:', error.message);
    res.status(500).json({ error: 'Server error checking submission' });
  }
};





// Creates a new room
exports.createGame = async (req, res) => {
  try {
    const { userId, minRating, maxRating } = req.body;

    //Validate User creating room 
    const player = await User.findById(userId);
    if (!player) return res.status(404).json({ error: 'User not found' });

    // Find a Random Problem matching criteria using mongo db syntax.
    const randomProblem = await Problem.aggregate([
      { 
        $match: { 
          rating: { $gte: minRating, $lte: maxRating } // e.g., 1000-1200
        } 
      },
      { $sample: { size: 1 } } // Randomly pick 1
    ]);

    if (randomProblem.length === 0) {
      return res.status(404).json({ error: 'No problems found in this rating range' });
    }

    const problem = randomProblem[0];

    // Create the Game Room
    const newGame = new Game({
      roomId: uuidv4(), // Generates a unique string like "9b1deb4d..."
      player1: userId,
      player2: null, // Waiting for opponent
      problem: {
        contestId: problem.contestId,
        index: problem.index,
        name: problem.name,
        rating: problem.rating,
        url: `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`
      },
      status: 'WAITING'
    });

    await newGame.save();

    // Return the Room ID to the frontend
    res.status(201).json({ 
      success: true, 
      roomId: newGame.roomId,
      gameId: newGame._id 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating game' });
  }
};

// join an existing battle
exports.joinGame = async (req, res) => {
  try {
    const { gameId, userId } = req.body;

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (game.player2) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Prevent user from playing against themselves
    if (game.player1.toString() === userId) {
      return res.status(400).json({ error: 'You are already in this game' });
    }

    // Update Game State
    game.player2 = userId;
    game.status = 'IN_PROGRESS';
    game.startTime = new Date();
    await game.save();

    res.json({ success: true, message: 'Game joined!', game });

  } catch (error) {
    res.status(500).json({ error: 'Server error joining game' });
  }
};