import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // You might need to add this: npx shadcn@latest add badge
import { Sword, Zap, History, User } from 'lucide-react';
import { socket } from '../socket';


const Lobby = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [findingMatch, setFindingMatch] = useState(false);

  useEffect(() => {
    // ... (Existing User loading logic) ...
    if (!socket.connected) socket.connect();
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
        navigate('/');
        return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // SOCKET LISTENERS
    socket.on('connect', () => console.log("Connected to WebSocket"));

    // NEW: Listen for "match_found"
    socket.on('match_found', (data) => {
      console.log("MATCH FOUND!", data);
      setFindingMatch(false);
      // Save game details and redirect
      navigate(`/battle/${data.roomId}`, { state: data });
    });

    return () => {
      socket.off('connect');
      socket.off('match_found');
    };
  }, [navigate]);

  const handleFindMatch = () => {
    setFindingMatch(true);
    
    // Emit the event to the backend
    // We send our User ID and Name so the server knows who is queuing
    socket.emit('join_queue', {
        userId: user.id, // Ensure your User model returns 'id' (or _id)
        username: user.username,
        codeDuelRating: user.codeDuelRating
    });
  };

  if (!user) return <div className="text-white text-center mt-20">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
          CodeDuel
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold text-white">{user.username}</p>
            <p className="text-xs text-slate-400">Rating: {user.codeDuelRating}</p>
          </div>
          <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
            <User className="h-6 w-6 text-cyan-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. MATCHMAKING CARD (Main Action) */}
        <Card className="md:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sword className="text-red-500" /> Battle Arena
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-slate-950/50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-800 mb-6">
              <p className="text-slate-400 mb-2">Ranked 1v1 • Random Problem • 10 Mins</p>
              {findingMatch && <p className="text-cyan-400 animate-pulse">Searching for opponent...</p>}
            </div>
            <Button 
              size="lg" 
              className={`w-full font-bold text-lg ${findingMatch ? "bg-slate-700" : "bg-red-600 hover:bg-red-700"}`}
              onClick={handleFindMatch}
              disabled={findingMatch}
            >
              {findingMatch ? "Cancel Search" : "Find Match"}
            </Button>
          </CardContent>
        </Card>

        {/* 2. STATS CARD */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="text-yellow-500" /> Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">Wins</span>
              <span className="text-green-400 font-bold">{user.wins || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">Losses</span>
              <span className="text-red-400 font-bold">{user.losses || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400">Streak</span>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                🔥 0
              </Badge>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Lobby;