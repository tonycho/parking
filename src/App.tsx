import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { useParking } from './hooks/useParking';

function App() {
  const { isAuthenticated } = useParking();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/\" replace /> : <Login />
        } 
      />
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login\" replace />
        } 
      />
    </Routes>
  );
}

export default App;