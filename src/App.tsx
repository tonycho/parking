import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Vehicles from './pages/Vehicles';
import { useParking } from './hooks/useParking';

function App() {
  const { isAuthenticated, isLoading } = useParking();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" /> : <Login />
        } 
      />
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
        } 
      />
      <Route 
        path="/vehicles" 
        element={
          isAuthenticated ? <Vehicles /> : <Navigate to="/login" />
        } 
      />
    </Routes>
  );
}

export default App;