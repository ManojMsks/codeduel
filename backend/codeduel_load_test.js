const { io } = require("socket.io-client");

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";
const NUM_CLIENTS = parseInt(process.env.NUM_CLIENTS || "20", 10);

// For your specific backend, the best thing to test is the matchmaking queue, 
// since submission goes through a REST API (which queries Codeforces and MongoDB), not a socket event.
const JOIN_EVENT = "join_queue";
const RESULT_EVENT = "match_found";

const latencies = [];
let connected = 0;
let failed = 0;
let resultsReceived = 0;

function makeClient(id) {
  const socket = io(SERVER_URL, { transports: ["websocket"], timeout: 5000 });
  
  let sentAt;

  socket.on("connect", () => {
    connected++;
    
    // Track when we sent the join request
    sentAt = Date.now();
    
    // Emit the join_queue event with the payload your backend expects
    socket.emit(JOIN_EVENT, { 
      username: `loadtest-user-${id}`, 
      userId: `fake-id-${id}`,
      codeDuelRating: 1000
    });

    // Wait for the match_found event
    socket.once(RESULT_EVENT, (matchData) => {
      const latency = Date.now() - sentAt;
      latencies.push(latency);
      resultsReceived++;
    });
  });

  socket.on("connect_error", (err) => {
    failed++;
    console.error(`Client ${id} failed to connect:`, err.message);
  });

  return socket;
}

console.log(`Spinning up ${NUM_CLIENTS} clients against ${SERVER_URL} ...`);
const clients = [];
for (let i = 0; i < NUM_CLIENTS; i++) {
  clients.push(makeClient(i));
}

// Give everything time to connect, join, match, and respond
setTimeout(() => {
  console.log("\n---- LOAD TEST SUMMARY ----");
  console.log(`Clients attempted:      ${NUM_CLIENTS}`);
  console.log(`Successful connections: ${connected}`);
  console.log(`Failed connections:     ${failed}`);
  console.log(`Matches received:       ${resultsReceived}`);

  if (latencies.length > 0) {
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const max = Math.max(...latencies);
    const min = Math.min(...latencies);
    console.log(`Avg matchmaking latency: ${avg.toFixed(1)}ms`);
    console.log(`Min / Max latency:       ${min}ms / ${max}ms`);
  } else {
    console.log("No results received — check your backend logs.");
  }

  clients.forEach((c) => c.disconnect());
  process.exit(0);
}, 8000);
