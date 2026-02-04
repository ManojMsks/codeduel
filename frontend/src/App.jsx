import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Battle from './pages/Battle'; // <--- IMPORT THIS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        {/* NEW ROUTE BELOW: The ":roomId" part is a variable */}
        <Route path="/battle/:roomId" element={<Battle />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;