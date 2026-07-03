const Game = require('../models/Game');
const Problem = require('../models/Problem');
const User = require('../models/User');
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

     // Get both players
const winner = await User.findById(userId);
const loserId = game.player1.toString() === userId ? game.player2 : game.player1;
const loser = await User.findById(loserId);

// ELO calculation
const K = 32;

const expectedWinner = 1 / (1 + Math.pow(10, (loser.codeDuelRating - winner.codeDuelRating) / 400));
const expectedLoser = 1 - expectedWinner;

const winnerNewRating = Math.round(winner.codeDuelRating + K * (1 - expectedWinner));
const loserNewRating = Math.round(loser.codeDuelRating + K * (0 - expectedLoser));

// Update both players
await User.findByIdAndUpdate(userId, { 
  $inc: { wins: 1 },
  $set: { codeDuelRating: winnerNewRating }
});

await User.findByIdAndUpdate(loserId, { 
  $inc: { losses: 1 },
  $set: { codeDuelRating: Math.max(100, loserNewRating) } // floor at 100, never goes below
});


      //update the loser
      const io = req.app.get('io');
      
      // 2. Broadcast event to everyone in this room
      // roomId is stored in the game document
      io.to(game.roomId).emit('game_over', {
        winner: userId,
        winnerNewRating,
        loserNewRating: Math.max(100, loserNewRating)
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





