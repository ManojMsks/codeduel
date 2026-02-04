const mongoose = require('mongoose');
const axios = require('axios');
// Fix: Adjust path to look for .env in the current folder OR parent
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

const Problem = require('../models/Problem');

console.log("🚀 Seeder Script Starting...");

// 1. DEBUG: Check if we found the database URL
const dbUri = process.env.MONGODB_URI;
if (!dbUri) {
    console.error("❌ FATAL ERROR: Could not find MONGODB_URI.");
    console.error("👉 Make sure your .env file is in the 'backend' folder.");
    console.error("👉 Current directory:", process.cwd());
    process.exit(1);
}

console.log("🔗 Connecting to MongoDB...");

mongoose.connect(dbUri)
  .then(() => {
      console.log('✅ MongoDB Connected. Fetching problems from Codeforces...');
      seedProblems();
  })
  .catch(err => {
      console.error('❌ MongoDB Connection Error:', err);
      process.exit(1);
  });

const seedProblems = async () => {
  try {
    // 2. Fetch Data
    const response = await axios.get('https://codeforces.com/api/problemset.problems');
    const problems = response.data.result.problems;
    console.log(`📦 Fetched ${problems.length} problems from API.`);

    // 3. Filter Data (Rating 800-2000, Must have tags, contestId, and index)
    const filteredProblems = problems.filter(p => 
        p.rating >= 800 && p.rating <= 2000 && 
        p.tags && p.tags.length > 0 &&
        p.contestId && p.index
    );
    console.log(`🔍 Filtered down to ${filteredProblems.length} useable problems.`);

    // 4. Clean & Save
    console.log("🗑️  Deleting old problems...");
    await Problem.deleteMany({});

    console.log("💾 Inserting new problems (this takes ~30 seconds)...");
    
    // Format for our Database
    const problemDocs = filteredProblems.map(p => ({
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      type: p.type,
      rating: p.rating,
      tags: p.tags,
      uniqueId: `${p.contestId}_${p.index}` // Add uniqueId
    }));

    await Problem.insertMany(problemDocs);

    console.log('✅ SUCCESS: Database is now full!');
    process.exit();
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
};