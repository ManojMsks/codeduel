require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');       // used for cross origin reference. 
const http = require('http'); 
const { Server } = require('socket.io'); 
const Game = require('./models/Game');
const Problem = require('./models/Problem');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  "http://localhost:5173",
  "https://codeduel-ochre.vercel.app" // we have to replace this with the web url
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Middleware
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(' MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes'); 

app.use('/api/users', userRoutes);
app.use('/api/game', gameRoutes);



const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Use the same list here
    methods: ["GET", "POST"]
  }
});

// NEW LINE: Make 'io' accessible to your controllers
app.set('io', io);      //pattern for sharing objects.

// Listen for connections
// GLOBAL VARIABLE (In-memory Queue)
let waitingPlayer = null; 

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. HANDLE 'JOIN_QUEUE'
  socket.on('join_queue', async (userData) => {
    console.log("Request received from:", userData.username); // LOG 1

    try {
      if (waitingPlayer) {
        console.log("Found waiting player:", waitingPlayer.username); // LOG 2
        
        const opponent = waitingPlayer;
        
        if (opponent.userId === userData.userId) {
            console.log("PREVENTED SELF-MATCH!"); // LOG 3
            return; 
        }

        console.log("Creating Match..."); // LOG 4
        // ... (rest of the match logic)
        console.log(`Match Found: ${opponent.username} vs ${userData.username}`);

        // A. Find a Random Problem (Rating 800-1200 for now)
        // Note: If you haven't run the seeder yet, this might fail. 
        // We will add a fallback just in case.
        // Pick problem based on average rating of both players
        const avgRating = Math.round((opponent.rating + userData.codeDuelRating) / 2);
        const minRating = avgRating - 100;
        const maxRating = avgRating + 100;

        let problem;
        const randomProblems = await Problem.aggregate([
            { $match: { rating: { $gte: minRating, $lte: maxRating } } },
            { $sample: { size: 1 } }
        ]);

        if (randomProblems.length > 0) {
            problem = randomProblems[0];
        } else {
            // Fallback: if no problem in range, pick any random problem
            const fallback = await Problem.aggregate([{ $sample: { size: 1 } }]);
            problem = fallback.length > 0 ? fallback[0] : {
                contestId: 4, index: 'A', name: 'Watermelon (Test)',
                rating: 800, tags: ['math']
            };
        }

        // B. Create the Game in MongoDB
        const roomId = uuidv4();
        const newGame = new Game({
          roomId: roomId,
          player1: opponent.userId,
          player2: userData.userId,
          problem: {
            contestId: problem.contestId,
            index: problem.index,
            name: problem.name,
            rating: problem.rating,
            url: `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`
          },
          status: 'IN_PROGRESS',
          startTime: new Date()
        });

        await newGame.save();

        // C. Notify Both Players
        // Emit to the Waiting Player (Opponent)
       io.to(opponent.socketId).emit('match_found', { 
            roomId, 
            opponent: userData.username, 
            gameId: newGame._id,
            problem: newGame.problem 
        });

        // Emit to the Current Player (You)
        socket.emit('match_found', { 
            roomId, 
            opponent: opponent.username, 
            gameId: newGame._id,
            problem: newGame.problem
        });

        // Clear the queue
        waitingPlayer = null;
      } else {
        // No one is waiting. Put this player in the queue.
        waitingPlayer = {
          socketId: socket.id,
          userId: userData.userId,
          username: userData.username,
          rating: userData.codeDuelRating
        };
        console.log(`User ${userData.username} joined the queue...`);
      }

    } catch (err) {
      console.error("Matchmaking Error:", err);
    }
  });

  // NEW LISTENER: Allow users to join a specific battle room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });


  // 2. HANDLE DISCONNECT
  socket.on('disconnect', () => {
    // If the waiting player disconnects, remove them from queue
    if (waitingPlayer && waitingPlayer.socketId === socket.id) {
        console.log("Waiting player disconnected. Queue cleared.");
        waitingPlayer = null;
    }
    console.log('User Disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});