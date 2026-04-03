import ReactPlayer from 'react-player';
import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Video, AppSettings } from '../types';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
  initialTime?: number;
  onProgress?: (progress: number) => void;
}

export default function VideoPlayer({ video, onClose, initialTime = 0, onProgress }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'YUGA Play',
    appLogo: '',
    appDetails: 'This app created by Veer',
    updatedAt: Date.now(),
    updatedBy: ''
  });
  const playerRef = useRef<any>(null);
  const Player = ReactPlayer as any;

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setAppSettings(doc.data() as AppSettings);
      }
    });
    return () => unsubscribeSettings();
  }, []);

  const isDriveLink = video.url.includes('drive.google.com') || video.url.includes('docs.google.com');
  const driveId = isDriveLink ? video.url.match(/[a-zA-Z0-9_-]{25,}/)?.[0] : null;
  const drivePreviewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null;

  const handleReady = () => {
    setPlaying(true);
    if (initialTime > 0 && playerRef.current) {
      playerRef.current.seekTo(initialTime, 'seconds');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
    >
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 sm:gap-4">
          {appSettings.appLogo ? (
            <img 
              src={appSettings.appLogo} 
              alt={appSettings.appName} 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover border border-white/10"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl text-white">
              {appSettings.appName.charAt(0)}
            </div>
          )}
          <div className="overflow-hidden">
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight truncate max-w-[150px] sm:max-w-md">{video.title}</h2>
            <p className="text-white/40 text-[10px] sm:text-xs uppercase tracking-widest">Playing Now</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-90"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="w-full h-full relative group">
        {isDriveLink && drivePreviewUrl ? (
          <iframe 
            src={drivePreviewUrl}
            className="w-full h-full border-none"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <Player 
            ref={playerRef}
            url={video.url}
            width="100%"
            height="100%"
            controls={true}
            playing={playing}
            onReady={handleReady}
            onProgress={(state: { playedSeconds: number }) => {
              if (onProgress) onProgress(state.playedSeconds);
            }}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload'
                }
              }
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
