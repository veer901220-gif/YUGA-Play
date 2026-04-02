import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Video, UserProfile } from '../types';
import { Users, Film, Activity, ArrowLeft, Shield, Mail, Calendar, Hash, UserMinus } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);

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

    return () => {
      unsubscribeUsers();
      unsubscribeVideos();
    };
  }, []);

  const handleRemoveUser = async (userId: string) => {
    if (isDeletingUser) return;
    setIsDeletingUser(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    } finally {
      setIsDeletingUser(null);
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
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white">Admin Dashboard</h1>
              <p className="text-white/40 text-[10px] sm:text-sm font-medium uppercase tracking-widest">YUGA Play Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-600/10 border border-orange-600/20 rounded-full text-orange-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest self-start sm:self-auto">
            <Activity className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-pulse" />
            Live Analytics
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
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
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#ffffff40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #ffffff10', 
                      borderRadius: '16px',
                      color: '#fff' 
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User List */}
          <div className="bg-[#121212] border border-white/5 p-8 rounded-[2.5rem]">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Registered Users
              </div>
              <span className="text-xs text-white/20 uppercase tracking-widest">{users.length} Total</span>
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map((user, i) => (
                <div key={user.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="w-10 h-10 rounded-full border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        {user.displayName}
                        {user.isOnline ? (
                          <span className="flex items-center gap-1 text-[10px] text-green-500 font-black uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Offline</span>
                        )}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      user.role === 'admin' ? "bg-orange-600/20 text-orange-500" : "bg-blue-600/20 text-blue-500"
                    )}>
                      {user.role}
                    </div>
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleRemoveUser(user.uid)}
                        disabled={isDeletingUser === user.uid}
                        className="p-2 text-white/20 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove User"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed User Table */}
        <div className="bg-[#121212] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5">
            <h3 className="text-xl font-bold text-white">User Management Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">User ID</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Profile</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Email</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Role</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Active Time</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Last Active</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 font-mono text-xs text-white/40">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3" />
                        {user.uid}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <img src={user.photoURL} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        <span className="text-sm font-bold text-white">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Mail className="w-4 h-4 text-white/20" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest",
                        user.role === 'admin' ? "bg-orange-600 text-white" : "bg-white/10 text-white/60"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {user.isOnline ? (
                          <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-1">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-white/5 text-white/20 text-[10px] font-black uppercase tracking-widest rounded-md">
                            Offline
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Activity className="w-3.5 h-3.5 text-green-500" />
                        {user.isOnline && user.sessionStart ? formatDuration(user.sessionStart) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Calendar className="w-3.5 h-3.5" />
                        {user.lastActive ? formatLastActive(user.lastActive) : 'Never'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => handleRemoveUser(user.uid)}
                          disabled={isDeletingUser === user.uid}
                          className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all active:scale-90 disabled:opacity-50"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
