import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SubsidyPage } from './pages/SubsidyPage';
import { InsurancePage } from './pages/InsurancePage';
import { WeatherPage } from './pages/WeatherPage';
import { MachineryPage } from './pages/MachineryPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminRoute } from './components/AdminRoute';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Dedicated Protected Admin Route */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AppShell>
                  <AdminDashboardPage />
                </AppShell>
              </AdminRoute>
            }
          />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/subsidy" element={<SubsidyPage />} />
                    <Route path="/insurance" element={<InsurancePage />} />
                    <Route path="/weather" element={<WeatherPage />} />
                    <Route path="/machinery" element={<MachineryPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
