import { Routes, Route } from 'react-router-dom';
import './src/index.css';
import Home from './src/pages/Home';
import HostSpace from './src/pages/HostSpace';
import Admin from './src/pages/Admin';
import Payment from './src/pages/Payment';
import ErrorBoundary from './src/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host" element={<HostSpace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/payment" element={<Payment />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
