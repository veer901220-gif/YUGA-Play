import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { LogIn, LogOut, Shield, User as UserIcon, Search, Info, X, AlertCircle, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  const { user, isAdmin, login, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'YUGA Play',
    appLogo: '',
    appDetails: 'This app created by Veer',
    updatedAt: Date.now(),
    updatedBy: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.getSettings();
        setAppSettings(settings);
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppDetails, setShowAppDetails] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await login();
      setShowLoginModal(false);
    } catch (error) {
      setLoginError("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {appSettings.appLogo ? (
          <img 
            src={appSettings.appLogo} 
            alt={appSettings.appName} 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover border border-white/10"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl text-white shadow-lg shadow-orange-600/20">
            {appSettings.appName.charAt(0)}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white">
          {appSettings.appName}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            {isAdmin && (
              <button 
                onClick={onOpenDashboard}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-orange-600/10 border border-orange-600/20 rounded-full text-orange-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-orange-600 hover:text-white transition-all"
              >
                <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden xs:inline">Dashboard</span>
              </button>
            )}
            
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-3 p-1 sm:pr-3 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 group"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xs border border-white/10">
                    {user.displayName.charAt(0)}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-white group-hover:text-orange-500 transition-colors truncate max-w-[100px]">{user.displayName}</p>
                </div>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName} 
                          className="w-10 h-10 rounded-full border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold border border-white/10">
                          {user.displayName.charAt(0)}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                        <p className="text-[10px] text-white/40 truncate uppercase tracking-widest">{user.role}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setShowAppDetails(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-4 text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                    >
                      <Info className="w-4 h-4" />
                      App Details
                    </button>

                    <button 
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full flex items-center gap-3 px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-orange-600 hover:text-white transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Login
          </button>
        )}
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-600/20">
                  <UserCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Login with Google</h3>
                <p className="text-white/40 text-sm">Sign in securely to access your account</p>
              </div>

              <div className="space-y-4">
                {loginError && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" />
                    {loginError}
                  </div>
                )}

                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-orange-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {isLoggingIn ? 'SIGNING IN...' : 'SIGN IN WITH GOOGLE'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Details Popup */}
      <AnimatePresence>
        {showAppDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white">
                  {appSettings.appName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{appSettings.appName}</h3>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Application Details</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {appSettings.appDetails}
                </p>
              </div>

              <button 
                onClick={() => setShowAppDetails(false)}
                className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-orange-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-full h-full rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-3xl border-2 border-white/10 shadow-xl">
                {user?.displayName.charAt(0)}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-4 border-[#121212]">
                <LogOut className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white mb-2">Please Confirm to Logout</h3>
            <p className="text-white/40 text-sm mb-8">Are you sure you want to sign out, <span className="text-white font-bold">{user?.displayName}</span>?</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="py-3 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all active:scale-95"
              >
                No
              </button>
              <button 
                onClick={() => {
                  logout();
                  setShowLogoutConfirm(false);
                  setShowUserMenu(false);
                }}
                className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
              >
                Yes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </nav>
  );
}
