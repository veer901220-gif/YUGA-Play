import { useState, useEffect } from 'react';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { LogIn, LogOut, Shield, User as UserIcon, Search, Info, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'YUGA Play',
    appLogo: '',
    appDetails: 'This app created by Veer',
    updatedAt: Date.now(),
    updatedBy: ''
  });

  useEffect(() => {
    // Check for redirect result on mount
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect login error:", error);
      setLoginError("Login failed. Please check your internet or Firebase settings.");
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().role === 'admin');
          } else {
            const isDefaultAdmin = currentUser.email === 'karmveer901220@gmail.com';
            setIsAdmin(isDefaultAdmin);
            await setDoc(doc(db, 'users', currentUser.uid), {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: isDefaultAdmin ? 'admin' : 'user'
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      } else {
        setIsAdmin(false);
      }
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setAppSettings(doc.data() as AppSettings);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppDetails, setShowAppDetails] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    
    // Check if we are on mobile or in a standalone app (like APK)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    try {
      if (isMobile || isStandalone) {
        // Redirect is better for mobile/APK
        await signInWithRedirect(auth, googleProvider);
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupError: any) {
          // If popup is blocked, try redirect
          if (popupError.code === 'auth/popup-blocked') {
            await signInWithRedirect(auth, googleProvider);
          } else {
            throw popupError;
          }
        }
      }
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error("Login failed:", error);
        let msg = "Login failed. ";
        if (error.code === 'auth/unauthorized-domain') {
          msg += "This domain is not authorized in Firebase Console.";
        } else if (error.code === 'auth/network-request-failed') {
          msg += "Network error. Check your internet or SHA-1 fingerprint.";
        } else {
          msg += error.message || "Check your Firebase settings.";
        }
        setLoginError(msg);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutConfirm(false);
      setShowUserMenu(false);
    } catch (error) {
      console.error("Logout failed:", error);
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
        {loginError && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-medium animate-pulse">
            <AlertCircle className="w-3 h-3" />
            {loginError}
            <button onClick={() => setLoginError(null)} className="ml-1 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
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
                <img 
                  src={user.photoURL || ''} 
                  alt={user.displayName || ''} 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10"
                  referrerPolicy="no-referrer"
                />
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
                      <img 
                        src={user.photoURL || ''} 
                        alt={user.displayName || ''} 
                        className="w-10 h-10 rounded-full border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                        <p className="text-[10px] text-white/40 truncate">{user.email}</p>
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
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-orange-600 hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoggingIn ? 'Connecting...' : 'Login'}
          </button>
        )}
      </div>

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
              <img 
                src={user?.photoURL || ''} 
                alt={user?.displayName || ''} 
                className="w-full h-full rounded-2xl border-2 border-white/10 object-cover"
                referrerPolicy="no-referrer"
              />
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
                onClick={handleLogout}
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
