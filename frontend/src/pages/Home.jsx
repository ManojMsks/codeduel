import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sword, Trophy, Zap } from 'lucide-react'; // Icons
import axios from 'axios';
import { Loader2 } from 'lucide-react'; // Add this for a loading spinner


const Home = () => {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!handle) return;
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      // CALL YOUR BACKEND
      // Note: In Vite, we usually proxy this, but for now we use the direct URL
      const response = await axios.post(`${API_URL}/api/users/enter`, { handle });

      if (response.data.success) {
        // Save user data to local storage so we can use it in the Lobby
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/lobby');
      }
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'Could not connect to server'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      
      {/* 1. THE HERO SECTION */}
      <div className="text-center mb-10 space-y-4">
        <h1 className="text-6xl font-extrabold tracking-tight lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          CodeDuel
        </h1>
        <p className="text-xl text-slate-400 max-w-lg mx-auto">
          1v1 Competitive Programming Battles. <br/>
          Prove your logic under pressure.
        </p>
      </div>

      {/* 2. THE LOGIN CARD */}
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Enter the Arena</CardTitle>
          <CardDescription>Enter your Codeforces handle to begin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input 
              placeholder="e.g. tourist" 
              className="bg-slate-950 border-slate-700 text-white"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          <Button 
  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
  onClick={handleStart}
  disabled={loading} // Disable button while loading
>
  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sword className="mr-2 h-4 w-4" />} 
  {loading ? "Verifying..." : "Battle Now"}
</Button>
        </CardContent>
      </Card>

      {/* 3. FEATURES GRID (Visual Filler) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl w-full">
        <FeatureCard 
          icon={<Zap className="text-yellow-400" />} 
          title="Real-Time" 
          desc="Live score updates via WebSockets." 
        />
        <FeatureCard 
          icon={<Sword className="text-red-400" />} 
          title="1v1 Lockout" 
          desc="First to solve wins. No second place." 
        />
        <FeatureCard 
          icon={<Trophy className="text-purple-400" />} 
          title="Ranked System" 
          desc="Climb the CodeDuel ELO ladder." 
        />
      </div>
    </div>
  );
};

// Simple helper component for the features
const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-6 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col items-center text-center hover:bg-slate-900 transition-colors">
    <div className="mb-4 p-3 bg-slate-800 rounded-full">{icon}</div>
    <h3 className="font-bold text-lg text-slate-200 mb-2">{title}</h3>
    <p className="text-sm text-slate-500">{desc}</p>
  </div>
);

export default Home;