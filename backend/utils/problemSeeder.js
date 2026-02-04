const axios = require('axios');
const Problem = require('../models/Problem');

// fetches problems from CF and updates the database.
const seedProblems = async () => {
  try {
    console.log('Fetching problems from Codeforces...');
    const response = await axios.get('https://codeforces.com/api/problemset.problems');
    if (response.data.status !== 'OK') {
  throw new Error('Codeforces API failed');
}

    const problems = response.data.result.problems;

    // filter problems to update database.
    const formattedProblems = problems
      .filter(p => p.rating && p.tags.length > 0) // Must have rating & tags
      .map(p => ({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags,
        uniqueId: `${p.contestId}_${p.index}` // "1234_A"
      }));

    // Bulk Write 
    const operations = formattedProblems.map(p => ({
      updateOne: {                                    // updateone mongodb syntax
        filter: { uniqueId: p.uniqueId },
        update: { $set: p },
        upsert: true            // update + insert this checks if present update else add.
      }
    }));

    if (operations.length > 0) {
      await Problem.bulkWrite(operations);              // bulkwrite function given by mongoose for bulk writting expects an array
      console.log(`Successfully seeded ${operations.length} problems!`);
    }

  } catch (error) {
    console.error('Error seeding problems:', error.message);
  }
};

module.exports = seedProblems;