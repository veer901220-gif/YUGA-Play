import { useState, useEffect, useRef } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc, Unsubscribe, deleteDoc, writeBatch, updateDoc, limit } from 'firebase/firestore';
import { Video, Playlist, AppSettings } from './types';
import Navbar from './components/Navbar';
import VideoCard from './components/VideoCard';
import AdminUpload from './components/AdminUpload';
import VideoPlayer from './components/VideoPlayer';
import AdminDashboard from './components/AdminDashboard';
import PlaylistManager from './components/PlaylistManager';
import { Play, Film, Search, Filter, LayoutGrid, List, PlaySquare, Plus, MoreVertical, Trash2, BookmarkPlus, Folder, CheckCircle2, History, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { setDoc } from 'firebase/firestore';

function PlaylistCard({ 
  playlist, 
  isAdmin, 
  isSaved, 
  onOpen, 
  onSave, 
  onDelete, 
  onEdit,
  openMenuPlaylistId, 
  setOpenMenuPlaylistId,
  videos
}: { 
  playlist: Playlist; 
  isAdmin: boolean; 
  isSaved: boolean; 
  onOpen: () => void; 
  onSave: () => void; 
  onDelete: () => void; 
  onEdit: () => void;
  openMenuPlaylistId: string | null;
  setOpenMenuPlaylistId: (id: string | null) => void;
  videos: Video[];
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-[#121212] border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 hover:border-orange-600/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-600/5"
    >
      {/* Three Dot Menu */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenuPlaylistId(openMenuPlaylistId === playlist.id ? null : playlist.id);
          }}
          className="p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-md border border-white/5"
        >
          <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        <AnimatePresence>
          {openMenuPlaylistId === playlist.id && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); onSave(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Saved
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4 text-orange-500" />
                    Save Playlist
                  </>
                )}
              </button>
              {isAdmin && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors border-t border-white/5"
                  >
                    <Edit2 className="w-4 h-4 text-orange-500" />
                    Edit Playlist
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div 
        onClick={onOpen}
        className="cursor-pointer"
      >
        <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 bg-white/5 flex items-center justify-center">
          {/* Folder Style Visual */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent" />
          <Folder className="w-20 h-20 text-orange-600/40 group-hover:text-orange-600 transition-all duration-500 group-hover:scale-110" />
          <Play className="absolute w-8 h-8 text-white fill-white opacity-40 group-hover:opacity-100 transition-opacity" />
          
          {/* Show first video thumbnail as overlay if exists */}
          {(playlist.thumbnailUrl || playlist.videoIds.length > 0) && (
            <img 
              src={playlist.thumbnailUrl || videos.find(v => v.id === playlist.videoIds[0])?.thumbnailUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
            />
          )}
          
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
            <List className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-[10px] font-black tracking-widest text-white uppercase">{playlist.videoIds.length} Videos</span>
          </div>
        </div>
        <h4 className="text-xl font-black text-white mb-2 group-hover:text-orange-500 transition-colors">{playlist.title}</h4>
        <p className="text-white/40 text-sm line-clamp-2 mb-2 font-medium leading-relaxed">{playlist.description || 'No description available'}</p>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [isAdminUploadOpen, setIsAdminUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'playlists' | 'mylist' | 'history'>('home');
  const [myList, setMyList] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [openMenuPlaylistId, setOpenMenuPlaylistId] = useState<string | null>(null);
  const [savedPlaylistIds, setSavedPlaylistIds] = useState<string[]>([]);
  const [history, setHistory] = useState<Video[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'YUGA Play',
    appLogo: '',
    appDetails: 'This app created by Veer',
    updatedAt: Date.now(),
    updatedBy: ''
  });
  
  // Presence Heartbeat
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    // Set online on mount
    const setOnline = async () => {
      try {
        await updateDoc(userRef, {
          isOnline: true,
          lastActive: Date.now(),
          sessionStart: Date.now()
        });
      } catch (e) {
        console.error("Error setting online status:", e);
      }
    };

    setOnline();

    const handleTabClose = () => {
      updateDoc(userRef, {
        isOnline: false,
        lastActive: Date.now()
      }).catch(e => console.error("Error setting offline status on tab close:", e));
    };

    window.addEventListener('beforeunload', handleTabClose);

    // Heartbeat every 60 seconds
    const interval = setInterval(async () => {
      try {
        await updateDoc(userRef, {
          lastActive: Date.now(),
          isOnline: true
        });
      } catch (e) {
        console.error("Error updating heartbeat:", e);
      }
    }, 60000);

    // Set offline on unmount/logout
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleTabClose);
      updateDoc(userRef, {
        isOnline: false,
        lastActive: Date.now()
      }).catch(e => console.error("Error setting offline status:", e));
    };
  }, [user]);

  useEffect(() => {
    let unsubscribeVideos: Unsubscribe | null = null;
    let unsubscribePlaylists: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeVideos) {
        unsubscribeVideos();
        unsubscribeVideos = null;
      }
      if (unsubscribePlaylists) {
        unsubscribePlaylists();
        unsubscribePlaylists = null;
      }

      if (currentUser) {
        const isDefaultAdmin = currentUser.email === 'karmveer901220@gmail.com';
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          setIsAdmin(isDefaultAdmin || (userDoc.exists() && userDoc.data().role === 'admin'));
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setIsAdmin(isDefaultAdmin);
        }

        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        unsubscribeVideos = onSnapshot(q, (snapshot) => {
          const videoData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Video[];
          setVideos(videoData);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'videos');
        });

        // Fetch all playlists (or just admin ones, but usually all)
        const pq = query(collection(db, 'playlists'), orderBy('createdAt', 'desc'));
        unsubscribePlaylists = onSnapshot(pq, (snapshot) => {
          const playlistData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Playlist[];
          setPlaylists(playlistData);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'playlists');
        });
      } else {
        setIsAdmin(false);
        setVideos([]);
        setPlaylists([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeVideos) unsubscribeVideos();
      if (unsubscribePlaylists) unsubscribePlaylists();
    };
  }, []);

  const filteredVideos = videos.filter(v => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (v.title?.toLowerCase() || '').includes(query) ||
           (v.description?.toLowerCase() || '').includes(query);
  });

  const displayVideos = (() => {
    const query = searchQuery.toLowerCase().trim();
    const baseList = activeTab === 'home' ? filteredVideos : 
                    activeTab === 'history' ? history : 
                    myList;
    
    if (!query) return baseList;
    return baseList.filter(v => 
      (v.title?.toLowerCase() || '').includes(query) ||
      (v.description?.toLowerCase() || '').includes(query)
    );
  })();

  useEffect(() => {
    if (!user) {
      setMyList([]);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'mylist'), orderBy('savedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const savedVideoIds = snapshot.docs.map(doc => doc.id);
      const savedVideos = videos.filter(v => savedVideoIds.includes(v.id));
      setMyList(savedVideos);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'mylist');
    });

    const spq = query(collection(db, 'users', user.uid, 'savedPlaylists'));
    const unsubscribeSavedPlaylists = onSnapshot(spq, (snapshot) => {
      setSavedPlaylistIds(snapshot.docs.map(doc => doc.id));
    });

    const hq = query(collection(db, 'users', user.uid, 'history'), orderBy('watchedAt', 'desc'), limit(50));
    const unsubscribeHistory = onSnapshot(hq, (snapshot) => {
      const sortedHistory = snapshot.docs.map(doc => {
        const video = videos.find(v => v.id === doc.id);
        return video ? { ...video, watchedAt: doc.data().watchedAt, progress: doc.data().progress } : null;
      }).filter(Boolean) as Video[];
      setHistory(sortedHistory);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'history');
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setAppSettings(doc.data() as AppSettings);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeSavedPlaylists();
      unsubscribeHistory();
      unsubscribeSettings();
    };
  }, [user, videos]);

  const handleDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    try {
      await deleteDoc(doc(db, 'playlists', playlistToDelete.id));
      setPlaylistToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `playlists/${playlistToDelete.id}`);
    }
  };

  const handleSavePlaylist = async (playlist: Playlist) => {
    if (!user) return;
    try {
      const isSaved = savedPlaylistIds.includes(playlist.id);
      if (isSaved) {
        await deleteDoc(doc(db, 'users', user.uid, 'savedPlaylists', playlist.id));
      } else {
        await setDoc(doc(db, 'users', user.uid, 'savedPlaylists', playlist.id), {
          savedAt: Date.now()
        });
      }
      setOpenMenuPlaylistId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/savedPlaylists/${playlist.id}`);
    }
  };

  const handlePlayVideo = async (video: Video) => {
    setSelectedVideo(video);
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'history', video.id), {
        watchedAt: Date.now()
      });
    } catch (error) {
      console.error("Error adding to history:", error);
    }
  };

  const lastSaveTimeRef = useRef<number>(0);
  const handleVideoProgress = async (video: Video, progress: number) => {
    if (!user) return;
    
    // Throttle saves to every 5 seconds
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 5000) return;
    lastSaveTimeRef.current = now;

    try {
      await setDoc(doc(db, 'users', user.uid, 'history', video.id), {
        progress
      }, { merge: true });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-600 selection:text-white">
      <Navbar onOpenDashboard={() => setIsDashboardOpen(true)} />

      <main className="pt-24 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        {!user ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-orange-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-orange-600/20 overflow-hidden"
            >
              {appSettings.appLogo ? (
                <img src={appSettings.appLogo} alt={appSettings.appName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              )}
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4">Welcome to {appSettings.appName}</h2>
            <p className="text-white/40 text-base sm:text-lg max-w-md mb-8">
              Login with your Google account to access our premium video library and start watching.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#121212] p-3 sm:p-4 rounded-3xl border border-white/5">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input 
                  type="text" 
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors text-sm sm:text-base"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => setIsPlaylistOpen(true)}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-colors flex items-center gap-2"
                    >
                      <PlaySquare className="w-5 h-5" />
                      <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">Manage Playlists</span>
                    </button>
                    <div className="h-8 w-[1px] bg-white/10 mx-2" />
                  </>
                )}
                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
                <button className="p-3 bg-orange-600 text-white rounded-xl transition-colors">
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-colors">
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Grid or Playlist Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeTab === 'playlists' ? (
                    <PlaySquare className="w-6 h-6 text-orange-600" />
                  ) : activeTab === 'history' ? (
                    <History className="w-6 h-6 text-orange-600" />
                  ) : (
                    <Film className="w-6 h-6 text-orange-600" />
                  )}
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    {activeTab === 'mylist' ? "My Saved List" : activeTab === 'playlists' ? "Featured Playlists" : activeTab === 'history' ? "Watch History" : "Recent Uploads"}
                  </h3>
                </div>
                <p className="text-white/40 text-sm font-medium uppercase tracking-widest">
                  {activeTab === 'playlists' ? `${playlists.length} Playlists` : activeTab === 'history' ? `${history.length} Videos` : `${displayVideos.length} Videos`}
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-video bg-white/5 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : activeTab === 'playlists' || activeTab === 'mylist' || activeTab === 'history' ? (
                <div className="space-y-8 sm:space-y-12">
                  {selectedPlaylist ? (
                    <div className="space-y-6 sm:space-y-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <button 
                          onClick={() => setSelectedPlaylist(null)}
                          className="flex items-center gap-2 text-orange-600 font-bold hover:text-orange-500 transition-colors text-sm"
                        >
                          <Play className="w-4 h-4 rotate-180 fill-orange-600" />
                          BACK TO PLAYLISTS
                        </button>
                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{selectedPlaylist.title}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                        {videos.filter(v => selectedPlaylist.videoIds.includes(v.id)).map(video => (
                          <VideoCard 
                            key={video.id} 
                            video={video} 
                            isAdmin={isAdmin}
                            onPlay={handlePlayVideo}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'mylist' && savedPlaylistIds.length > 0 && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <PlaySquare className="w-6 h-6 text-orange-600" />
                            <h3 className="text-2xl font-black tracking-tight">Saved Playlists</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                            {playlists.filter(p => savedPlaylistIds.includes(p.id)).map(playlist => (
                              <PlaylistCard 
                                key={playlist.id}
                                playlist={playlist}
                                isAdmin={isAdmin}
                                isSaved={true}
                                onOpen={() => setSelectedPlaylist(playlist)}
                                onSave={() => handleSavePlaylist(playlist)}
                                onDelete={() => setPlaylistToDelete(playlist)}
                                onEdit={() => { setPlaylistToEdit(playlist); setIsPlaylistOpen(true); }}
                                openMenuPlaylistId={openMenuPlaylistId}
                                setOpenMenuPlaylistId={setOpenMenuPlaylistId}
                                videos={videos}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'mylist' && displayVideos.length > 0 && (
                        <div className="space-y-6 pt-8 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            <BookmarkPlus className="w-6 h-6 text-orange-600" />
                            <h3 className="text-2xl font-black tracking-tight">Saved Videos</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                            {displayVideos.map(video => (
                              <VideoCard 
                                key={`saved-${video.id}`} 
                                video={video} 
                                isAdmin={isAdmin}
                                onPlay={handlePlayVideo}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'history' && (
                        <div className="space-y-6">
                          {displayVideos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                              {displayVideos.map(video => (
                                <VideoCard 
                                  key={`history-tab-${video.id}`} 
                                  video={video} 
                                  isAdmin={isAdmin}
                                  onPlay={handlePlayVideo}
                                  variant="compact"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                              <History className="w-12 h-12 text-white/10 mb-4" />
                              <h4 className="text-xl font-bold text-white/40">
                                {searchQuery ? "No matching history" : "No history yet"}
                              </h4>
                              <p className="text-white/20 text-sm">
                                {searchQuery ? "Try a different search term." : "Videos you watch will appear here."}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'mylist' && savedPlaylistIds.length === 0 && displayVideos.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                          <List className="w-12 h-12 text-white/10 mb-4" />
                          <h4 className="text-xl font-bold text-white/40">Your list is empty</h4>
                          <p className="text-white/20 text-sm">Save videos or playlists to watch them later.</p>
                        </div>
                      )}
                      
                      {activeTab === 'playlists' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                          {playlists.map(playlist => (
                            <PlaylistCard 
                              key={playlist.id}
                              playlist={playlist}
                              isAdmin={isAdmin}
                              isSaved={savedPlaylistIds.includes(playlist.id)}
                              onOpen={() => setSelectedPlaylist(playlist)}
                              onSave={() => handleSavePlaylist(playlist)}
                              onDelete={() => setPlaylistToDelete(playlist)}
                              onEdit={() => { setPlaylistToEdit(playlist); setIsPlaylistOpen(true); }}
                              openMenuPlaylistId={openMenuPlaylistId}
                              setOpenMenuPlaylistId={setOpenMenuPlaylistId}
                              videos={videos}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  
                  {activeTab === 'playlists' && playlists.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                      <PlaySquare className="w-12 h-12 text-white/10 mb-4" />
                      <h4 className="text-xl font-bold text-white/40">No Playlists Found</h4>
                      <p className="text-white/20 text-sm">Check back later for curated collections.</p>
                    </div>
                  )}
                </div>
              ) : displayVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                  {displayVideos.map(video => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      isAdmin={isAdmin}
                      onPlay={handlePlayVideo}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                  <Film className="w-12 h-12 text-white/10 mb-4" />
                  <h4 className="text-xl font-bold text-white/40">No videos found</h4>
                  <p className="text-white/20 text-sm">Try searching for something else or check back later.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 px-6 py-3 flex items-center justify-around z-40 md:hidden">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-orange-600' : 'text-white/40'}`}
          >
            <Play className={`w-6 h-6 ${activeTab === 'home' ? 'fill-orange-600' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('playlists')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'playlists' ? 'text-orange-600' : 'text-white/40'}`}
          >
            <PlaySquare className={`w-6 h-6 ${activeTab === 'playlists' ? 'fill-orange-600' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Playlists</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('mylist')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'mylist' ? 'text-orange-600' : 'text-white/40'}`}
          >
            <List className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">My List</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-orange-600' : 'text-white/40'}`}
          >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </button>
        </div>
      )}

      {/* Desktop Sidebar/Tabs */}
      {user && (
        <div className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col gap-4 z-40">
          <button 
            onClick={() => setActiveTab('home')}
            className={`p-4 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-110' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            title="Home"
          >
            <Play className={`w-6 h-6 ${activeTab === 'home' ? 'fill-white' : ''}`} />
          </button>

          <button 
            onClick={() => setActiveTab('playlists')}
            className={`p-4 rounded-2xl transition-all ${activeTab === 'playlists' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-110' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            title="Playlists"
          >
            <PlaySquare className={`w-6 h-6 ${activeTab === 'playlists' ? 'fill-white' : ''}`} />
          </button>

          <button 
            onClick={() => setActiveTab('mylist')}
            className={`p-4 rounded-2xl transition-all ${activeTab === 'mylist' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-110' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            title="My List"
          >
            <List className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={`p-4 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-110' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            title="History"
          >
            <History className="w-6 h-6" />
          </button>
        </div>
      )}

      {isAdmin && (
        <AdminUpload 
          isOpen={isAdminUploadOpen} 
          onClose={() => setIsAdminUploadOpen(false)} 
        />
      )}

      <AnimatePresence>
        {selectedVideo && (
          <VideoPlayer 
            video={selectedVideo} 
            onClose={() => setSelectedVideo(null)} 
            initialTime={history.find(h => h.id === selectedVideo.id)?.progress || 0}
            onProgress={(progress) => handleVideoProgress(selectedVideo, progress)}
          />
        )}
        {isDashboardOpen && (
          <AdminDashboard onClose={() => setIsDashboardOpen(false)} />
        )}
        {isPlaylistOpen && (
          <PlaylistManager 
            onClose={() => { setIsPlaylistOpen(false); setPlaylistToEdit(null); }} 
            videos={videos}
            initialPlaylist={playlistToEdit}
          />
        )}
      </AnimatePresence>

      {/* Floating Upload Button for Admin */}
      {isAdmin && (
        <button 
          onClick={() => setIsAdminUploadOpen(true)}
          className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-orange-600/40 hover:scale-110 active:scale-95 transition-all z-50 group"
          title="Upload Video"
        >
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}

      {/* Delete Confirmation Popup */}
      <AnimatePresence>
        {playlistToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Do you want to Delete?</h3>
              <p className="text-white/40 text-sm mb-8">This action cannot be undone. The playlist <span className="text-white font-bold">"{playlistToDelete.title}"</span> will be permanently removed.</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setPlaylistToDelete(null)}
                  className="py-3 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all active:scale-95"
                >
                  No
                </button>
                <button 
                  onClick={handleDeletePlaylist}
                  className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            {appSettings.appLogo ? (
              <img src={appSettings.appLogo} alt={appSettings.appName} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">
                {appSettings.appName.charAt(0)}
              </div>
            )}
            <h1 className="text-xl font-black tracking-tighter text-white">
              {appSettings.appName}
            </h1>
          </div>
          <p className="text-white/20 text-sm font-medium uppercase tracking-widest">© 2026 {appSettings.appName}. All rights reserved.</p>
          <div className="flex items-center gap-6 text-white/40 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-orange-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
