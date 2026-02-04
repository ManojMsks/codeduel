const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  contestId: { type: Number, required: true },
  index: { type: String, required: true }, // "A"
  name: { type: String, required: true },
  rating: { type: Number },
  tags: [String], // ["dp", "greedy"] 
  
  uniqueId: { type: String, unique: true } // format: "1234_A"
});

module.exports = mongoose.model('Problem', problemSchema);  