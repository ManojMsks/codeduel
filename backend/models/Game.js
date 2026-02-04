const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true }, 
  
  player1: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  player2: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null // Null while waiting for opponent
  },

  // We store the problem details HERE. 
  problem: {
    contestId: Number,
    index: String, // e.g., "A", "B"
    name: String,
    rating: Number,
    url: String
  },

  //  Game State
  status: { 
    type: String, 
    enum: ['WAITING', 'IN_PROGRESS', 'FINISHED', 'ABORTED'], 
    default: 'WAITING' 
  },
  winner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  
  startTime: { type: Date },
  endTime: { type: Date },

}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);