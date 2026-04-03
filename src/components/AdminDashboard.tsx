import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Video, UserProfile, AppSettings } from '../types';
import { Users, Film, Activity, ArrowLeft, Shield, Mail, Calendar, Hash, UserMinus, Settings, Save, Globe, Image as ImageIcon, Info, UserPlus, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '../lib/utils';

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
  
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'YUGA Play',
    appLogo: '',
    appDetails: 'This app created by Veer',
    updatedAt: Date.now(),
    updatedBy: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const MAIN_ADMIN_EMAIL = 'karmveer901220@gmail.com';

  useEffect(() => {
    const qUsers = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const userData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(userData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    const qVideos = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsubscribeVideos = onSnapshot(qVideos, (snapshot) => {
      const videoData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
      setVideos(videoData);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'videos'));

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setAppSettings(doc.data() as AppSettings);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeVideos();
      unsubscribeSettings();
    };
  }, []);

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (userEmail === MAIN_ADMIN_EMAIL) {
      alert("Main Admin cannot be removed!");
      return;
    }
    if (isDeletingUser) return;
    if (!confirm(`Are you sure you want to remove ${userEmail}?`)) return;

    setIsDeletingUser(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    } finally {
      setIsDeletingUser(null);
    }
  };

  const handleUpdateRole = async (userId: string, userEmail: string, newRole: 'admin' | 'user') => {
    if (userEmail === MAIN_ADMIN_EMAIL) {
      alert("Main Admin's role cannot be changed!");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...appSettings,
        updatedAt: Date.now(),
        updatedBy: users.find(u => u.email === MAIN_ADMIN_EMAIL)?.uid || 'system'
      });
      alert('Settings updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Videos', value: videos.length, icon: Film, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Active Admins', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const chartData = [
    { name: 'Users', value: users.length },
    { name: 'Videos', value: videos.length },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
  ];

  const formatLastActive = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatDuration = (startTime: number) => {
    const diff = Date.now() - startTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just started';
    if (minutes < 60) return `${minutes}m`;
    return `${hours}h ${minutes % 60}m`;
  };

  const COLORS = ['#3b82f6', '#f97316', '#a855f7'];

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-[#0a0a0a] overflow-y-auto"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={onClose}
              className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl text-white transition-all active:scale-90"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white">{appSettings.appName} Dashboard</h1>
              <p className="text-white/40 text-[10px] sm:text-sm font-medium uppercase tracking-widest">Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-600/10 border border-orange-600/20 rounded-full text-orange-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest self-start sm:self-auto">
            <Activity className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-pulse" />
            Live Analytics
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
              activeTab === 'overview' ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-white/40 hover:text-white"
            )}
          >
            <Activity className="w-4 h-4" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
              activeTab === 'users' ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-white/40 hover:text-white"
            )}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
              activeTab === 'settings' ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-white/40 hover:text-white"
            )}
          >
            <Settings className="w-4 h-4" />
            App Settings
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#121212] border border-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden group"
                  >
                    <div className={cn("absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 opacity-10 blur-3xl rounded-full", stat.bg)} />
                    <div className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6", stat.bg)}>
                      <stat.icon className={cn("w-6 h-6 sm:w-7 sm:h-7", stat.color)} />
                    </div>
                    <p className="text-white/40 text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tighter">{stat.value}</h3>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Chart */}
                <div className="bg-[#121212] border border-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem]">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                    Platform Overview
                  </h3>
                  <div className="h-[250px] sm:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '16px', color: '#fff' }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Users */}
                <div className="bg-[#121212] border border-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem]">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-6 sm:mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      Recent Users
                    </div>
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-xs font-bold text-white truncate max-w-[120px]">{user.displayName}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">{user.role}</p>
                          </div>
                        </div>
                        {user.isOnline && (
                          <span className="flex items-center gap-1 text-[10px] text-green-500 font-black uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Online
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#121212] border border-white/5 rounded-2xl sm:rounded-[2.5rem] overflow-hidden"
            >
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">User Management</h3>
                <div className="text-xs text-white/20 uppercase tracking-widest font-black">{users.length} Total Users</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Profile</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Role</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={user.photoURL} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-white truncate max-w-[150px]">{user.displayName}</p>
                              <p className="text-[10px] text-white/40 truncate max-w-[150px]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                              user.role === 'admin' ? "bg-orange-600 text-white" : "bg-white/10 text-white/60"
                            )}>
                              {user.role}
                            </span>
                            {user.email === MAIN_ADMIN_EMAIL && (
                              <ShieldAlert className="w-3 h-3 text-orange-500" title="Main Admin" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.isOnline ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-500 font-black uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Online
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Offline</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.email !== MAIN_ADMIN_EMAIL && (
                              <>
                                {user.role === 'admin' ? (
                                  <button 
                                    onClick={() => handleUpdateRole(user.uid, user.email, 'user')}
                                    className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition-all"
                                    title="Demote to User"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUpdateRole(user.uid, user.email, 'admin')}
                                    className="p-2 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-lg transition-all"
                                    title="Promote to Admin"
                                  >
                                    <Shield className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleRemoveUser(user.uid, user.email)}
                                  disabled={isDeletingUser === user.uid}
                                  className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                                  title="Remove User"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto w-full"
            >
              <div className="bg-[#121212] border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">App Configuration</h3>
                    <p className="text-white/40 text-xs sm:text-sm">Customize your platform identity</p>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">App Name</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                        <input 
                          required
                          type="text"
                          value={appSettings.appName}
                          onChange={e => setAppSettings({...appSettings, appName: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors"
                          placeholder="e.g. YUGA Play"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">App Logo URL</label>
                      <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                        <input 
                          type="url"
                          value={appSettings.appLogo}
                          onChange={e => setAppSettings({...appSettings, appLogo: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <p className="text-[10px] text-white/20 ml-1 italic">Leave empty to use default text logo</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">App Details (About)</label>
                      <div className="relative">
                        <Info className="absolute left-4 top-4 w-5 h-5 text-white/20" />
                        <textarea 
                          required
                          rows={4}
                          value={appSettings.appDetails}
                          onChange={e => setAppSettings({...appSettings, appDetails: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors resize-none"
                          placeholder="Tell users about this app..."
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSavingSettings}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-orange-600/20"
                  >
                    {isSavingSettings ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        SAVE CHANGES
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
