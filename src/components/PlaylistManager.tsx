import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { X, Plus, PlaySquare, Trash2, List as ListIcon, Edit2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Playlist, Video } from '../types';

interface PlaylistManagerProps {
  onClose: () => void;
  videos: Video[];
  initialPlaylist?: Playlist | null;
}

export default function PlaylistManager({ onClose, videos, initialPlaylist }: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', thumbnailUrl: '' });
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPlaylist) {
      handleStartEdit(initialPlaylist);
    }
  }, [initialPlaylist]);

  useEffect(() => {
    if (!auth.currentUser) {
      setPlaylists([]);
      return;
    }

    const q = query(collection(db, 'playlists'), where('authorId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Playlist[];
      setPlaylists(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'playlists');
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingPlaylist(null);
    setFormData({ title: '', description: '', thumbnailUrl: '' });
    setSelectedVideoIds([]);
  };

  const handleStartEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setIsCreating(false);
    setFormData({ 
      title: playlist.title, 
      description: playlist.description || '', 
      thumbnailUrl: playlist.thumbnailUrl || '' 
    });
    setSelectedVideoIds(playlist.videoIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.title) return;

    setLoading(true);
    try {
      if (editingPlaylist) {
        await updateDoc(doc(db, 'playlists', editingPlaylist.id), {
          ...formData,
          videoIds: selectedVideoIds,
        });
      } else {
        await addDoc(collection(db, 'playlists'), {
          ...formData,
          videoIds: selectedVideoIds,
          createdAt: Date.now(),
          authorId: auth.currentUser.uid
        });
      }
      setFormData({ title: '', description: '', thumbnailUrl: '' });
      setSelectedVideoIds([]);
      setIsCreating(false);
      setEditingPlaylist(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      try {
        await deleteDoc(doc(db, 'playlists', id));
        if (editingPlaylist?.id === id) {
          setEditingPlaylist(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `playlists/${id}`);
      }
    }
  };

  const toggleVideoSelection = (id: string) => {
    setSelectedVideoIds(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl h-[90vh] sm:h-[85vh] bg-[#121212] border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-4 sm:p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-600/10 to-transparent">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tighter flex items-center gap-2 sm:gap-3">
              <PlaySquare className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              Playlist Manager
            </h2>
            <p className="text-white/40 text-[10px] sm:text-sm font-medium uppercase tracking-widest mt-1">Create and edit your collections</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-colors text-white/60"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Playlist List */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto p-4 sm:p-6 space-y-4 bg-black/20 max-h-[30vh] md:max-h-full">
            <button 
              onClick={handleStartCreate}
              className="w-full p-3 sm:p-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              NEW PLAYLIST
            </button>

            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {playlists.map(playlist => (
                <div 
                  key={playlist.id}
                  onClick={() => handleStartEdit(playlist)}
                  className={`group p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex-shrink-0 w-[200px] md:w-full ${
                    editingPlaylist?.id === playlist.id 
                      ? "bg-orange-600/20 border-orange-600/50" 
                      : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white truncate pr-2 text-sm sm:text-base">{playlist.title}</h3>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist.id); }}
                      className="p-1.5 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <p className="text-white/30 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">{playlist.videoIds.length} Videos</p>
                </div>
              ))}
              {playlists.length === 0 && !isCreating && (
                <div className="text-center py-4 md:py-10 opacity-20 w-full">
                  <ListIcon className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No Playlists</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <AnimatePresence mode="wait">
              {isCreating || editingPlaylist ? (
                <motion.form 
                  key={editingPlaylist ? 'edit' : 'create'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {editingPlaylist ? `Edit: ${editingPlaylist.title}` : 'Create New Playlist'}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => { setIsCreating(false); setEditingPlaylist(null); }}
                      className="text-white/40 hover:text-white text-[10px] sm:text-sm font-bold uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest ml-2">Playlist Title</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Title"
                          value={formData.title}
                          onChange={e => setFormData({...formData, title: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest ml-2">Thumbnail URL (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="https://..."
                          value={formData.thumbnailUrl}
                          onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest ml-2">Description</label>
                      <textarea 
                        placeholder="Description"
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors resize-none text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] sm:text-sm font-black text-white/60 uppercase tracking-widest">Select Videos ({selectedVideoIds.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {videos.map(video => (
                        <div 
                          key={video.id}
                          onClick={() => toggleVideoSelection(video.id)}
                          className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                            selectedVideoIds.includes(video.id) 
                              ? "bg-orange-600/20 border-orange-600/50" 
                              : "bg-white/5 border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs sm:text-sm font-bold text-white truncate">{video.title}</h5>
                          </div>
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedVideoIds.includes(video.id) ? "bg-orange-600 border-orange-600" : "border-white/20"
                          }`}>
                            {selectedVideoIds.includes(video.id) && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    disabled={loading || !formData.title}
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 disabled:cursor-not-allowed text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : editingPlaylist ? (
                      <><Save className="w-4 h-4 sm:w-5 sm:h-5" /> UPDATE PLAYLIST</>
                    ) : (
                      <><Plus className="w-4 h-4 sm:w-5 sm:h-5" /> CREATE PLAYLIST</>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center opacity-20 py-10"
                >
                  <PlaySquare className="w-12 h-12 sm:w-20 sm:h-20 mb-4 sm:mb-6" />
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Select a playlist to edit or create a new one</h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
