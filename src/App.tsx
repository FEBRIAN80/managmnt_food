import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Cashier } from './pages/Cashier';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/*" element={<ProtectedRoute />}>
              <Route path="" element={<Layout />}>
                <Route 
                  path="" 
                  element={
                    <Navigate 
                      to={useAuth().profile?.role === 'admin' ? 'dashboard' : 'cashier'} 
                      replace 
                    />
                  } 
                />
                {useAuth().profile?.role === 'admin' && (
                  <>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="menu" element={<div className="p-6">Menu management coming soon...</div>} />
                    <Route path="suppliers" element={<div className="p-6">Supplier management coming soon...</div>} />
                    <Route path="transactions" element={<div className="p-6">Transaction history coming soon...</div>} />
                    <Route path="reports" element={<div className="p-6">Reports coming soon...</div>} />
                    <Route path="users" element={<div className="p-6">User management coming soon...</div>} />
                  </>
                )}
                {useAuth().profile?.role === 'cashier' && (
                  <>
                    <Route path="cashier" element={<Cashier />} />
                    <Route path="my-reports" element={<div className="p-6">My reports coming soon...</div>} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;