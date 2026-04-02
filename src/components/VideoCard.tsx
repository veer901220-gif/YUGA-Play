import { Trash2, Play, Clock, User, Plus, CheckCircle2, MoreVertical, Share2 } from 'lucide-react';
import { Video } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, deleteDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCompact = variant === 'compact';

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid, 'mylist', video.id), (doc) => {
      setIsSaved(doc.exists());
    });

    return () => unsubscribe();
  }, [video.id]);

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
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    setShowMenu(false);
    try {
      const savedDocRef = doc(db, 'users', user.uid, 'mylist', video.id);
      if (isSaved) {
        await deleteDoc(savedDocRef);
      } else {
        await setDoc(savedDocRef, {
          savedAt: Date.now(),
          videoId: video.id
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `mylist/${video.id}`);
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
      await deleteDoc(doc(db, 'videos', video.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `videos/${video.id}`);
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
                      onClick={handleDelete}
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
