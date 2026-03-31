import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './src/index.css';
import Home from './src/pages/Home';
import HostSpace from './src/pages/HostSpace';
import Admin from './src/pages/Admin';
import Payment from './src/pages/Payment';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/host" element={<HostSpace />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/payment" element={<Payment />} />
    </Routes>
  );
}

export default App;
