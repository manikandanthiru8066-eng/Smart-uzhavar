import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  HandCoins,
  ShieldCheck,
  CloudSun,
  Tractor,
  UserRound,
  Bell,
  Settings,
  Languages,
  Moon,
  Sun,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, { titleKey: string; subKey: string }> = {
  '/': { titleKey: 'navDashboard', subKey: 'subDashboard' },
  '/subsidy': { titleKey: 'navSubsidy', subKey: 'subSubsidy' },
  '/insurance': { titleKey: 'navInsurance', subKey: 'subInsurance' },
  '/weather': { titleKey: 'navWeather', subKey: 'subWeather' },
  '/machinery': { titleKey: 'navMachinery', subKey: 'subMachinery' },
  '/profile': { titleKey: 'navProfile', subKey: 'subProfile' },
  '/notifications': { titleKey: 'navNotifications', subKey: 'subNotifications' },
  '/settings': { titleKey: 'navSettings', subKey: 'subSettings' },
};

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  const currentPath = location.pathname;
  const currentMeta = pageTitles[currentPath] || { titleKey: 'brandName', subKey: 'subDashboard' };

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div id="appShell" className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brandmark">
          <span className="dot"></span>
          <span>{t('brandName')}</span>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `side-link ${isActive ? 'active' : ''}`
            }
          >
            <LayoutDashboard />
            <span className="lbl">{t('navDashboard')}</span>
          </NavLink>

          <NavLink
            to="/subsidy"
            className={({ isActive }) =>
              `side-link ${isActive ? 'active' : ''}`
            }
          >
            <HandCoins />
            <span className="lbl">{t('navSubsidy')}</span>
          </NavLink>

          <NavLink
            to="/insurance"
            className={({ isActive }) =>
              `side-link ${isActive ? 'active' : ''}`
            }
          >
            <ShieldCheck />
            <span className="lbl">{t('navInsurance')}</span>
          </NavLink>

          <NavLink
            to="/weather"
            className={({ isActive }) =>
              `side-link ${isActive ? 'active' : ''}`
            }
          >
            <CloudSun />
            <span className="lbl">{t('navWeather')}</span>
          </NavLink>

          <NavLink
            to="/machinery"
            className={({ isActive }) =>
              `side-link ${isActive ? 'active' : ''}`
            }
          >
            <Tractor />
            <span className="lbl">{t('navMachinery')}</span>
          </NavLink>

          <div className="side-divider"></div>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `side-link ${isActive ? 'active' : ''}`
            }
          >
            <UserRound />
            <span className="lbl">{t('navProfile')}</span>
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `side-link ${isActive ? 'active' : ''}`
            }
          >
            <Bell />
            <span className="lbl">{t('navNotifications')}</span>
            <span className="badge-dot"></span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `side-link ${isActive ? 'active' : ''}`
            }
          >
            <Settings />
            <span className="lbl">{t('navSettings')}</span>
          </NavLink>
        </nav>

        <div className="side-foot whitespace-pre-line">
          {t('sideFoot')}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h3>{t(currentMeta.titleKey)}</h3>
            <p>{t(currentMeta.subKey)}</p>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={toggleLanguage}
              title="Language"
            >
              <Languages />
            </button>

            <button
              className="icon-btn"
              onClick={toggleTheme}
              title="Theme"
            >
              {isDark ? <Sun /> : <Moon />}
            </button>

            <button className="icon-btn" title="Notifications">
              <Bell />
              <span className="dot-alert"></span>
            </button>

            <div className="avatar-chip">
              <div className="av">M</div>
              <span>{t('userNavName')}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};
