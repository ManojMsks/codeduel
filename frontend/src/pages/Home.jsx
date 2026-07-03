import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!handle) return;
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const response = await axios.post(`${API_URL}/api/users/enter`, { handle });
      if (response.data.success) {
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
    <div className="home">
      <div className="home-container">
        <h1>CodeDuel</h1>
        <p className="tagline">1v1 competitive programming battles.</p>

        <div className="login-box">
          <label>Codeforces Handle</label>
          <input
            type="text"
            placeholder="e.g. tourist"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
          <button onClick={handleStart} disabled={loading}>
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </div>

        <div className="features">
          <div className="feature">
            <span>Real-time</span>
            <p>Live updates via WebSockets</p>
          </div>
          <div className="feature">
            <span>1v1 Lockout</span>
            <p>First to solve wins</p>
          </div>
          <div className="feature">
            <span>Ranked</span>
            <p>Climb the CodeDuel ladder</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;