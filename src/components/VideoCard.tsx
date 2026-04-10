import { Trash2, Play, Clock, User, Plus, CheckCircle2, MoreVertical, Share2 } from 'lucide-react';
import { Video } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

interface VideoCardProps {
  video: Video;
  isAdmin: boolean;
  onPlay: (video: Video) => void;
  variant?: 'default' | 'compact';
}

export default function VideoCard({ 
  video, 
  isAdmin, 
  onPlay,
  variant = 'default'
}: VideoCardProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCompact = variant === 'compact';

  useEffect(() => {
    if (!user) return;
    setIsSaved(user.myList?.includes(video.id) || false);
  }, [video.id, user?.myList]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    setIsSaving(true);
    setShowMenu(false);
    try {
      let newList = user.myList ? [...user.myList] : [];
      
      if (isSaved) {
        newList = newList.filter(id => id !== video.id);
      } else {
        newList = [...newList, video.id];
      }
      
      await api.updateMyList(user.uid, newList);
      setIsSaved(!isSaved);
      
      // Dispatch a custom event so App.tsx can update its state if needed
      window.dispatchEvent(new CustomEvent('mylist-updated', { detail: { userId: user.uid, list: newList } }));
    } catch (error) {
      console.error('Error saving to list:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const shareData = {
      title: video.title,
      text: video.description,
      url: window.location.href + `?v=${video.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      setShowMenu(false);
    }
    
    try {
      await api.deleteVideo(video.id);
      window.dispatchEvent(new CustomEvent('video-deleted', { detail: { videoId: video.id } }));
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const handleClick = () => {
    onPlay(video);
  };

  const formattedDate = new Date(video.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className={cn(
        "group relative bg-[#1a1a1a] border border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer transition-all hover:border-orange-600/30",
        isCompact ? "flex flex-row items-center gap-3 sm:gap-4 p-2 sm:p-3" : "flex flex-col"
      )}
    >
      <div className={cn(
        "relative overflow-hidden shrink-0",
        isCompact ? "w-28 sm:w-40 aspect-video rounded-xl sm:rounded-2xl" : "aspect-video"
      )}>
        <img 
          src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/640/360`} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className={cn(
            "bg-orange-600 rounded-full flex items-center justify-center shadow-xl shadow-orange-600/40",
            isCompact ? "w-10 h-10" : "w-14 h-14"
          )}>
            <Play className={cn("text-white fill-white ml-1", isCompact ? "w-4 h-4" : "w-6 h-6")} />
          </div>
        </div>
        
        <div className={cn("absolute z-20", isCompact ? "top-2 right-2" : "top-4 right-4")} ref={menuRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={cn(
                "bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-xl text-white transition-all active:scale-90 shadow-lg border border-white/10",
                isCompact ? "p-1.5" : "p-2"
              )}
            >
              <MoreVertical className={cn(isCompact ? "w-4 h-4" : "w-5 h-5")} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30"
                >
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                  >
                    {isSaved ? <CheckCircle2 className="w-4 h-4 text-orange-600" /> : <Plus className="w-4 h-4" />}
                    {isSaved ? "Saved to List" : "Save Video"}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Video
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteConfirm(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Video
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Delete Video?</h3>
              <p className="text-white/40 text-sm mb-8">Are you sure you want to delete <span className="text-white font-bold">"{video.title}"</span>? This action cannot be undone.</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-3 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete()}
                  className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={cn(isCompact ? "flex-1 min-w-0 py-1" : "p-5")}>
        <h3 className={cn(
          "font-bold text-white line-clamp-1 group-hover:text-orange-500 transition-colors",
          isCompact ? "text-sm mb-1" : "text-lg mb-2"
        )}>
          {video.title}
        </h3>
        {!isCompact && (
          <p className="text-white/40 text-sm line-clamp-2 mb-4 h-10">
            {video.description || 'No description provided.'}
          </p>
        )}
        
        <div className={cn(
          "flex items-center justify-between",
          isCompact ? "mt-2" : "pt-4 border-t border-white/5"
        )}>
          <div className="flex items-center gap-2 text-white/30 text-[10px] font-medium uppercase tracking-wider">
            {video.authorPhotoURL ? (
              <img 
                src={video.authorPhotoURL} 
                alt={video.authorName} 
                className={cn("rounded-full border border-white/10", isCompact ? "w-3 h-3" : "w-4 h-4")}
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className={cn(isCompact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            )}
            <span className="truncate max-w-[80px]">{video.authorName}</span>
          </div>
          <div className="flex items-center gap-2 text-white/30 text-[10px] font-medium uppercase tracking-wider">
            <Clock className={cn(isCompact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            {formattedDate}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
