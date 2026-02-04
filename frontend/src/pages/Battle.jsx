import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, RefreshCw, Trophy, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { socket } from '../socket';

// We reuse the same socket connection
const socket = io('http://localhost:3001');

const Battle = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Game State
  const [gameData, setGameData] = useState(location.state || null); // Data passed from Lobby
  const [user, setUser] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    // 1. Load User
    if (!socket.connected) socket.connect();
    
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/');
    const currentUser = JSON.parse(storedUser);
    setUser(currentUser);

    // 2. Join the Socket Room for this specific battle
    socket.emit('join_room', roomId);

    // 3. Listen for Game Over
    socket.on('game_over', (data) => {
      setWinner(data.winner); // Backend tells us who won
      // If I won, play sound?
    });

    return () => {
      socket.off('game_over');
    };
  }, [roomId, navigate]);

  const handleCheckSubmission = async () => {
    if (!user || !gameData) return;
    setVerifying(true);

    try {
      const response = await axios.post('http://localhost:3001/api/game/verify', {
        gameId: gameData.gameId,
        userId: user.id // Ensure this matches your User model ID
      });

      if (response.data.success && response.data.gameStatus === 'FINISHED') {
        // We let the socket handle the UI update via 'game_over' event
        // But we can also set it locally for instant feedback
        setWinner(response.data.winner); 
      } else {
        alert("Not Accepted yet! Keep trying.");
      }
    } catch (error) {
      console.error(error);
      alert("Error checking submission");
    } finally {
      setVerifying(false);
    }
  };

  if (!gameData) return <div className="text-white p-10">Error: No Game Data Found. Go back to Lobby.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center">
      
      {/* 1. HEADER: You vs Opponent */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div className="text-left">
          <h2 className="text-xl font-bold text-cyan-400">YOU</h2>
          <p className="text-slate-400">{user?.username}</p>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            VS
          </h1>
          <p className="text-sm text-slate-500 mt-1">Room: {roomId.slice(0, 6)}...</p>
        </div>

        <div className="text-right">
          <h2 className="text-xl font-bold text-red-400">OPPONENT</h2>
          <p className="text-slate-400">{gameData.opponent}</p>
        </div>
      </div>

      {/* 2. MAIN BATTLE AREA */}
      {winner ? (
        // WINNER SCREEN
        <Card className="w-full max-w-md bg-slate-900 border-yellow-500/50">
          <CardContent className="pt-6 text-center space-y-4">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto" />
            <h2 className="text-3xl font-bold text-white">GAME OVER</h2>
            <p className="text-xl text-slate-300">
              Winner: <span className="text-yellow-400 font-bold">
                {winner === user?.id ? "YOU!" : "OPPONENT"}
              </span>
            </p>
            <Button onClick={() => navigate('/lobby')} className="w-full bg-slate-700">
              Return to Lobby
            </Button>
          </CardContent>
        </Card>
      ) : (
        // ACTIVE GAME SCREEN
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          
          {/* LEFT: The Problem */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">The Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-950 rounded border border-slate-800">
                <h3 className="text-xl font-bold text-white mb-2">{gameData.problem?.name || "Problem X"}</h3>
                <Badge variant="outline" className="text-cyan-400 border-cyan-400 mb-4">
                  Rating: {gameData.problem?.rating || 800}
                </Badge>
                <p className="text-slate-400 text-sm mb-4">
                  Solve this problem on Codeforces immediately. 
                  First to get "Accepted" wins.
                </p>
                <a 
                  href={gameData.problem?.url || "#"} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full"
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open Problem
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Status & Controls */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Control Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="text-center p-6 bg-slate-950 rounded border border-slate-800">
                <p className="text-slate-500 mb-2">Status</p>
                <p className="text-2xl font-mono text-white animate-pulse">IN PROGRESS...</p>
              </div>

              <div className="space-y-2">
                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700 font-bold text-lg"
                  onClick={handleCheckSubmission}
                  disabled={verifying}
                >
                  {verifying ? <RefreshCw className="mr-2 h-5 w-5 animate-spin"/> : null}
                  {verifying ? "Verifying..." : "I Have Submitted!"}
                </Button>
                <p className="text-xs text-center text-slate-500">
                  Click this ONLY after you get "Accepted" on Codeforces.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Battle;