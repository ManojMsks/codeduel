const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, 
  
  codeforcesHandle: { type: String, required: true, unique: true },
  currentCFRating: { type: Number, default: 0 }, 

  codeDuelRating: { type: Number, default: 1200 }, 
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },


}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash; 
  }
});

module.exports = mongoose.model('User', userSchema);