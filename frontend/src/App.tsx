import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { SubsidyPage } from './pages/SubsidyPage';
import { InsurancePage } from './pages/InsurancePage';
import { WeatherPage } from './pages/WeatherPage';
import { MachineryPage } from './pages/MachineryPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};

export default App;
