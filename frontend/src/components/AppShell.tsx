import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
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
  LogOut,
  Menu,
  X,
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
  const navigate = useNavigate();
  const { profile, username, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = profile?.fullName || profile?.username || username || 'Farmer';
  const initialLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const currentPath = location.pathname;
  const currentMeta = pageTitles[currentPath] || { titleKey: 'brandName', subKey: 'subDashboard' };

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Slide-over Drawer on Mobile */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="flex items-center justify-between brandmark">
          <div className="flex items-center gap-2">
            <span className="dot"></span>
            <span>{t('brandName')}</span>
          </div>
          {/* Close button on mobile */}
          <button
            className="md:hidden icon-btn p-1.5"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 mt-2">
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

        <div className="side-foot whitespace-pre-line mt-auto">
          {t('sideFoot')}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Hamburger Button for Mobile */}
            <button
              className="md:hidden icon-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <div>
              <h3>{t(currentMeta.titleKey)}</h3>
              <p>{t(currentMeta.subKey)}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={toggleLanguage}
              title="Language"
              aria-label="Toggle language"
            >
              <Languages size={18} />
            </button>

            <button
              className="icon-btn"
              onClick={toggleTheme}
              title="Theme"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <NavLink to="/notifications" className="icon-btn" title="Notifications" aria-label="Notifications">
              <Bell size={18} />
              <span className="dot-alert"></span>
            </NavLink>

            <NavLink to="/profile" className="avatar-chip" title="Profile">
              <div className="av">{initialLetter}</div>
              <span>{displayName}</span>
            </NavLink>

            <button className="icon-btn" title="Logout" onClick={handleLogout} aria-label="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="mobile-bottom-nav md:hidden">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <LayoutDashboard />
          <span>{t('navDashboard')}</span>
        </NavLink>

        <NavLink
          to="/subsidy"
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <HandCoins />
          <span>{t('navSubsidy')}</span>
        </NavLink>

        <NavLink
          to="/insurance"
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <ShieldCheck />
          <span>{t('navInsurance')}</span>
        </NavLink>

        <NavLink
          to="/machinery"
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <Tractor />
          <span>{t('navMachinery')}</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <UserRound />
          <span>{t('navProfile')}</span>
        </NavLink>
      </nav>
    </div>
  );
};
