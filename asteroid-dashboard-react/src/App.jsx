// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AsteroidDashboard from './components/AsteroidDashboard';
import styles from './App.module.css';

function Dashboard() {
  return (
    <div className={styles.appContainer}>
      <main className={styles.mainContent}>
        <AsteroidDashboard />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* This matches both the root / and /AnyAsteroidName */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/:asteroidId" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;