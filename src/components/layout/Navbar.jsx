import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X, User as UserIcon, Settings, LogOut, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    setLangMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const navigateToProfile = () => {
    navigate('/profile');
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">SP</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                SkyProperties
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-primary">
              {t('landing.featuredProperties')}
            </Link>

            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-primary"
                >
                  {t('dashboard.title')}
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                    aria-label={t('navbar.userMenu')}
                  >
                    <Avatar
                      src={userProfile?.photoURL || currentUser?.photoURL}
                      name={userProfile?.displayName || currentUser?.displayName || currentUser?.email}
                      size="md"
                    />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {userProfile?.displayName || currentUser?.displayName || t('navbar.user')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {currentUser?.email}
                        </p>
                      </div>
                      <button
                        onClick={navigateToProfile}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <UserIcon className="h-4 w-4 mr-3" />
                        {t('navbar.profile')}
                      </button>
                      <button
                        onClick={() => {
                          navigate('/permits');
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FileText className="h-4 w-4 mr-3" />
                        {t('permit.myPermits')}
                      </button>
                      <button
                        onClick={navigateToProfile}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        {t('navbar.settings')}
                      </button>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        {t('common.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">{t('common.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button>{t('common.register')}</Button>
                </Link>
              </>
            )}

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-label="Change language"
              >
                <Globe className="h-5 w-5" />
              </Button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200">
                  <button
                    onClick={toggleLanguage}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {i18n.language === 'en' ? 'العربية' : 'English'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('landing.featuredProperties')}
            </Link>

            {currentUser ? (
              <>
                <div className="flex items-center space-x-3 px-3 py-2 border-b border-gray-200">
                  <Avatar
                    src={userProfile?.photoURL || currentUser?.photoURL}
                    name={userProfile?.displayName || currentUser?.displayName || currentUser?.email}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {userProfile?.displayName || currentUser?.displayName || t('navbar.user')}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('dashboard.title')}
                </Link>
                <button
                  onClick={navigateToProfile}
                  className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <UserIcon className="h-4 w-4 mr-3" />
                  {t('navbar.profile')}
                </button>
                <button
                  onClick={() => {
                    navigate('/permits');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  {t('permit.myPermits')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100 rounded-md"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.register')}
                </Link>
              </>
            )}

            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700"
            >
              <Globe className="h-5 w-5" />
              <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
