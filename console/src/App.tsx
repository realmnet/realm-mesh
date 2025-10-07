import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/layout';
import { Dashboard } from '@/pages/dashboard';
import { Login } from '@/pages/login';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/realms" element={<div className="text-2xl">Realms Page</div>} />
          <Route path="/policies" element={<div className="text-2xl">Policies Page</div>} />
          <Route path="/services" element={<div className="text-2xl">Services Page</div>} />
          <Route path="/network" element={<div className="text-2xl">Network Page</div>} />
          <Route path="/monitoring" element={<div className="text-2xl">Monitoring Page</div>} />
          <Route path="/access" element={<div className="text-2xl">Access Control Page</div>} />
          <Route path="/users" element={<div className="text-2xl">Users Page</div>} />
          <Route path="/analytics" element={<div className="text-2xl">Analytics Page</div>} />
          <Route path="/settings" element={<div className="text-2xl">Settings Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;