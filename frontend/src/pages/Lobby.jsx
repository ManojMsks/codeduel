import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import './Lobby.css';

const Lobby = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [findingMatch, setFindingMatch] = useState(false);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(storedUser));

    socket.on('match_found', (data) => {
      setFindingMatch(false);
      navigate(`/battle/${data.roomId}`, { state: data });
    });

    return () => {
      socket.off('match_found');
    };
  }, [navigate]);

  const handleFindMatch = () => {
    setFindingMatch(true);
    socket.emit('join_queue', {
      userId: user.id,
      username: user.username,
      codeDuelRating: user.codeDuelRating
    });
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="lobby">
      <header className="lobby-header">
        <h1>CodeDuel</h1>
        <div className="user-info">
          <span className="username">{user.username}</span>
          <span className="rating">Rating: {user.codeDuelRating}</span>
        </div>
      </header>

      <div className="lobby-content">
        <div className="matchmaking-box">
          <h2>Battle Arena</h2>
          <p>Ranked 1v1 · Random Problem · 10 Minutes</p>
          {findingMatch && <p className="searching">Searching for opponent...</p>}
          <button
            onClick={handleFindMatch}
            disabled={findingMatch}
          >
            {findingMatch ? 'Searching...' : 'Find Match'}
          </button>
        </div>

        <div className="stats-box">
          <h2>Your Stats</h2>
          <div className="stat">
            <span>Wins</span>
            <strong>{user.wins || 0}</strong>
          </div>
          <div className="stat">
            <span>Losses</span>
            <strong>{user.losses || 0}</strong>
          </div>
          <div className="stat">
            <span>Rating</span>
            <strong>{user.codeDuelRating}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;