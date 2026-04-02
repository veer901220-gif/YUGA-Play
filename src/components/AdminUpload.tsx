import { useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Plus, X, Upload, Film, Link as LinkIcon, Type, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { resolveLink } from '../lib/utils';

interface AdminUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminUpload({ isOpen, onClose }: AdminUploadProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnailUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const processedUrl = await resolveLink(formData.url, 'video');
      const processedThumbnailUrl = await resolveLink(formData.thumbnailUrl, 'thumbnail');

      await addDoc(collection(db, 'videos'), {
        ...formData,
        url: processedUrl,
        thumbnailUrl: processedThumbnailUrl,
        createdAt: Date.now(),
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Admin',
        authorPhotoURL: auth.currentUser.photoURL || ''
      });
      setFormData({ title: '', description: '', url: '', thumbnailUrl: '' });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'videos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Upload Video</h2>
                  <p className="text-white/40 text-xs sm:text-sm">Add a new video to the library</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/60"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/20" />
                    <input 
                      required
                      type="text" 
                      placeholder="Video Title"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors text-sm sm:text-base"
                    />
                  </div>

                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-4 h-4 sm:w-5 sm:h-5 text-white/20" />
                    <textarea 
                      placeholder="Description (Optional)"
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors resize-none text-sm sm:text-base"
                    />
                  </div>

                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/20" />
                    <input 
                      required
                      type="url" 
                      placeholder="Video URL (Direct link)"
                      value={formData.url}
                      onChange={e => setFormData({...formData, url: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors text-sm sm:text-base"
                    />
                  </div>

                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/20" />
                    <input 
                      type="url" 
                      placeholder="Thumbnail URL (Optional)"
                      value={formData.thumbnailUrl}
                      onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-600/50 transition-colors text-sm sm:text-base"
                    />
                  </div>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 disabled:cursor-not-allowed text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      PUBLISH VIDEO
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
