import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { socket } from '../socket';
import './Battle.css';

const Battle = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [gameData, setGameData] = useState(location.state || null);
  const [user, setUser] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/');
    setUser(JSON.parse(storedUser));

    socket.emit('join_room', roomId);

    socket.on('game_over', (data) => {
      setWinner(data.winner);
      // Update localStorage so lobby shows fresh rating
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        const isWinner = data.winner === u.id;
        const updatedUser = {
          ...u,
          codeDuelRating: isWinner ? data.winnerNewRating : data.loserNewRating,
          wins: isWinner ? (u.wins || 0) + 1 : u.wins,
          losses: isWinner ? u.losses : (u.losses || 0) + 1
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    });

    return () => {
      socket.off('game_over');
    };
  }, []);

  const handleCheckSubmission = async () => {
    if (!user || !gameData) return;
    setVerifying(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const response = await axios.post(`${API_URL}/api/game/verify`, {
        gameId: gameData.gameId,
        userId: user.id
      });

      if (response.data.success && response.data.gameStatus === 'FINISHED') {
        setWinner(response.data.winner);
      } else {
        alert('Not accepted yet. Keep trying.');
      }
    } catch (error) {
      alert('Error checking submission');
    } finally {
      setVerifying(false);
    }
  };

  if (!gameData) return <div className="loading">No game data. Go back to lobby.</div>;

  return (
    <div className="battle">
      <header className="battle-header">
        <div className="player">
          <span className="label">You</span>
          <span className="name">{user?.username}</span>
        </div>
        <div className="vs">
          <h1>VS</h1>
          <p>Room: {roomId.slice(0, 6)}...</p>
        </div>
        <div className="player right">
          <span className="label">Opponent</span>
          <span className="name">{gameData.opponent}</span>
        </div>
      </header>

      {winner ? (
        <div className="result-box">
          <h2>Game Over</h2>
          <p className="winner-text">
            {winner === user?.id ? 'You won!' : 'Opponent won.'}
          </p>
          <button onClick={() => navigate('/lobby')}>Back to Lobby</button>
        </div>
      ) : (
        <div className="battle-content">
          <div className="problem-box">
            <h2>Problem</h2>
            <h3>{gameData.problem?.name}</h3>
            <p className="problem-rating">Rating: {gameData.problem?.rating}</p>
            <p className="problem-desc">Solve this on Codeforces. First to get Accepted wins.</p>
            <a href={gameData.problem?.url} target="_blank" rel="noreferrer">
              <button>Open Problem</button>
            </a>
          </div>

          <div className="control-box">
            <h2>Control</h2>
            <p className="status">IN PROGRESS</p>
            <button
              onClick={handleCheckSubmission}
              disabled={verifying}
            >
              {verifying ? 'Verifying...' : 'I Have Submitted!'}
            </button>
            <p className="hint">Click only after you get Accepted on Codeforces.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Battle;