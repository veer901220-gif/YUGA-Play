import { useState, useEffect } from 'react';
import { api } from '../api';
import { Video, UserProfile, AppSettings } from '../types';
import { Users, Film, Activity, ArrowLeft, Shield, Settings, Save, Globe, Image as ImageIcon, Info, UserMinus, ShieldAlert } from 'lucide-react';
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
  const [showConfirmModal, setShowConfirmModal] = useState<{ type: 'delete' | 'role', userId: string, displayName: string, role?: 'admin' | 'user' } | null>(null);
  
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'YUGA Play',
    appLogo: '',
    appDetails: 'This app created by Veer',
    updatedAt: Date.now(),
    updatedBy: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const SUPER_ADMIN_EMAIL = 'karmveer901220@gmail.com';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, videosData, settingsData] = await Promise.all([
          api.getUsers(),
          api.getVideos(),
          api.getSettings()
        ]);
        setUsers(usersData);
        setVideos(videosData);
        setAppSettings(settingsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling for "live" feel
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveUser = async (userId: string, email: string | null) => {
    if (email === SUPER_ADMIN_EMAIL) {
      return;
    }
    if (isDeletingUser) return;

    setIsDeletingUser(userId);
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.uid !== userId));
    } catch (error) {
      console.error('Error removing user:', error);
    } finally {
      setIsDeletingUser(null);
      setShowConfirmModal(null);
    }
  };

  const handleUpdateRole = async (userId: string, email: string | null, newRole: 'admin' | 'user') => {
    if (email === SUPER_ADMIN_EMAIL) {
      return;
    }
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setShowConfirmModal(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const updatedSettings = {
        ...appSettings,
        updatedAt: Date.now(),
        updatedBy: SUPER_ADMIN_EMAIL
      };
      await api.updateSettings(updatedSettings);
      setAppSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const stats = [
    { label: 'Total Registered', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Online Now', value: users.filter(u => u.isOnline).length, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Offline Users', value: users.length - users.filter(u => u.isOnline).length, icon: UserMinus, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Total Videos', value: videos.length, icon: Film, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const chartData = [
    { name: 'Total', value: users.length },
    { name: 'Online', value: users.filter(u => u.isOnline).length },
    { name: 'Offline', value: users.length - users.filter(u => u.isOnline).length },
    { name: 'Videos', value: videos.length },
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
              <div className="flex items-center gap-4 mt-1">
                <p className="text-white/40 text-[10px] sm:text-sm font-medium uppercase tracking-widest">Management System</p>
                <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">{users.filter(u => u.isOnline).length} Online</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-red-500/40 rounded-full" />
                    <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">{users.length - users.filter(u => u.isOnline).length} Offline</span>
                  </div>
                </div>
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white/40 text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tighter">{stat.value}</h3>
                      </div>
                      {stat.label === 'Online Now' && users.length > 0 && (
                        <div className="text-right pb-1">
                          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                            {Math.round((users.filter(u => u.isOnline).length / users.length) * 100)}% Active
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Chart */}
                <div className="lg:col-span-2 bg-[#121212] border border-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem]">
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

                {/* Online Users Summary */}
                <div className="bg-[#121212] border border-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem]">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-6 sm:mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      Online Now
                    </div>
                    <span className="text-xs text-green-500 font-black">{users.filter(u => u.isOnline).length}</span>
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {users.filter(u => u.isOnline).length > 0 ? (
                      users.filter(u => u.isOnline).map((user) => (
                        <div key={user.uid} className="flex items-center justify-between p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs border border-white/10">
                              {user.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white truncate max-w-[120px]">{user.displayName}</p>
                              <p className="text-[10px] text-green-500/60 font-bold uppercase tracking-widest">Active for {user.sessionStart ? formatDuration(user.sessionStart) : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center opacity-20">
                        <Users className="w-10 h-10 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No users online</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Users List */}
              <div className="bg-[#121212] border border-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem]">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  Recently Added Users
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...users].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8).map((user) => (
                    <div key={user.uid} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm border border-white/10">
                        {user.displayName.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  ))}
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
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Session Info</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img src={user.photoURL} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xs">
                                {user.displayName.charAt(0)}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-white truncate max-w-[150px]">{user.displayName}</p>
                              <p className="text-[10px] text-white/40 truncate max-w-[150px]">{user.email || 'Guest User'}</p>
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
                            {user.email === SUPER_ADMIN_EMAIL && (
                              <ShieldAlert className="w-3 h-3 text-orange-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              Session: {user.sessionStart ? new Date(user.sessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - {user.isOnline ? 'Now' : (user.lastActive ? new Date(user.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A')}
                            </div>
                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              Last Active: {user.lastActive ? formatLastActive(user.lastActive) : 'N/A'}
                            </div>
                            {user.sessionStart && (
                              <div className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                user.isOnline ? "text-orange-500" : "text-white/20"
                              )}>
                                {user.isOnline ? 'Active for: ' : 'Session was: '}{formatDuration(user.sessionStart)}
                              </div>
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
                            {user.email !== SUPER_ADMIN_EMAIL && (
                              <>
                                {user.role === 'admin' ? (
                                  <button 
                                    onClick={() => setShowConfirmModal({ type: 'role', userId: user.uid, displayName: user.displayName, role: 'user' })}
                                    className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition-all"
                                    title="Demote to User"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => setShowConfirmModal({ type: 'role', userId: user.uid, displayName: user.displayName, role: 'admin' })}
                                    className="p-2 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-lg transition-all"
                                    title="Promote to Admin"
                                  >
                                    <Shield className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => setShowConfirmModal({ type: 'delete', userId: user.uid, displayName: user.displayName })}
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
                showConfirmModal.type === 'delete' ? "bg-red-600/20 text-red-500" : "bg-orange-600/20 text-orange-500"
              )}>
                {showConfirmModal.type === 'delete' ? <UserMinus className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                {showConfirmModal.type === 'delete' ? 'Remove User?' : `Change Role to ${showConfirmModal.role}?`}
              </h3>
              <p className="text-white/40 text-sm mb-8">
                Are you sure you want to {showConfirmModal.type === 'delete' ? 'remove' : `change the role of`} <span className="text-white font-bold">{showConfirmModal.displayName}</span>?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirmModal(null)}
                  className="py-3 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (showConfirmModal.type === 'delete') {
                      handleRemoveUser(showConfirmModal.userId, users.find(u => u.uid === showConfirmModal.userId)?.email || null);
                    } else if (showConfirmModal.type === 'role' && showConfirmModal.role) {
                      handleUpdateRole(showConfirmModal.userId, users.find(u => u.uid === showConfirmModal.userId)?.email || null, showConfirmModal.role);
                    }
                  }}
                  className={cn(
                    "py-3 px-6 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg",
                    showConfirmModal.type === 'delete' ? "bg-red-600 hover:bg-red-500 shadow-red-600/20" : "bg-orange-600 hover:bg-orange-500 shadow-orange-600/20"
                  )}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
