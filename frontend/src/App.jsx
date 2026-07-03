import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Battle from './pages/Battle';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/battle/:roomId" element={<Battle />} />  // roomId is a dynamic parameter that will be passed to the Battle component during runtime.
      </Routes>
    </BrowserRouter>
  );
}

export default App;
