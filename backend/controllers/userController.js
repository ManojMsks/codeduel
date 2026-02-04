const User = require('../models/User');
const axios = require('axios');

exports.loginOrRegister = async (req, res) => {
  const { handle } = req.body;

  try {
    // Check if user already exists in OUR database
    let user = await User.findOne({ codeforcesHandle: handle });

    if (user) {
      return res.json({ success: true, user });
    }

    // If not, verify with Codeforces API
    // We hit the CF API to make sure it's a real person
    try {
      const cfResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
      
      if (cfResponse.data.status !== 'OK') {
        return res.status(404).json({ error: 'Codeforces handle not found' });
      }

      // Get their actual CF rating
      const cfData = cfResponse.data.result[0];
      const currentRating = cfData.rating || 0; // Default to 0 if unrated

      // Create the new user
      user = new User({
        username: handle, // For now, username = handle
        email: `${handle}@placeholder.com`, // Placeholder email
        passwordHash: "oauth_user", // Placeholder since we aren't doing passwords yet
        codeforcesHandle: handle,
        currentCFRating: currentRating,
        codeDuelRating: 1200
      });

      await user.save();
      
      return res.status(201).json({ success: true, user });

    } catch (cfError) {
      return res.status(404).json({ error: 'Codeforces handle does not exist' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};