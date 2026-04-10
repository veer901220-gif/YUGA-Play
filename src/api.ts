import { Video, Playlist, AppSettings, UserProfile } from './types';
import { db, auth } from './firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocFromServer
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const api = {
  // Videos
  async getVideos(): Promise<Video[]> {
    const path = 'videos';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Video));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  async addVideo(video: Omit<Video, 'id'>): Promise<Video> {
    const path = 'videos';
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, path, id), { ...video, id });
      return { ...video, id } as Video;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },
  async updateVideo(id: string, video: Partial<Video>): Promise<Video> {
    const path = `videos/${id}`;
    try {
      await updateDoc(doc(db, 'videos', id), video);
      const updated = await getDoc(doc(db, 'videos', id));
      return updated.data() as Video;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },
  async deleteVideo(id: string): Promise<void> {
    const path = `videos/${id}`;
    try {
      await deleteDoc(doc(db, 'videos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    const path = 'playlists';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Playlist));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  async addPlaylist(playlist: Omit<Playlist, 'id'>): Promise<Playlist> {
    const path = 'playlists';
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, path, id), { ...playlist, id });
      return { ...playlist, id } as Playlist;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },
  async updatePlaylist(id: string, playlist: Partial<Playlist>): Promise<Playlist> {
    const path = `playlists/${id}`;
    try {
      await updateDoc(doc(db, 'playlists', id), playlist);
      const updated = await getDoc(doc(db, 'playlists', id));
      return updated.data() as Playlist;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },
  async deletePlaylist(id: string): Promise<void> {
    const path = `playlists/${id}`;
    try {
      await deleteDoc(doc(db, 'playlists', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const path = 'settings/config';
    try {
      const snapshot = await getDoc(doc(db, 'settings', 'config'));
      if (snapshot.exists()) {
        return snapshot.data() as AppSettings;
      }
      const defaultSettings: AppSettings = {
        appName: 'YUGA Play',
        appLogo: '',
        appDetails: 'This app created by Veer',
        updatedAt: Date.now(),
        updatedBy: ''
      };
      await setDoc(doc(db, 'settings', 'config'), defaultSettings);
      return defaultSettings;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  },
  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const path = 'settings/config';
    try {
      await updateDoc(doc(db, 'settings', 'config'), settings);
      const updated = await getDoc(doc(db, 'settings', 'config'));
      return updated.data() as AppSettings;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  // Users
  async getUsers(): Promise<UserProfile[]> {
    const path = 'users';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },
  async updateUser(uid: string, user: Partial<UserProfile>): Promise<UserProfile> {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), user);
      const updated = await getDoc(doc(db, 'users', uid));
      return updated.data() as UserProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },
  async updateUserRole(uid: string, role: 'admin' | 'user'): Promise<UserProfile> {
    return this.updateUser(uid, { role });
  },
  async deleteUser(uid: string): Promise<void> {
    const path = `users/${uid}`;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },
  async ping(uid: string): Promise<void> {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), { lastActive: Date.now(), isOnline: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // User Data (My List, History, etc.)
  async updateMyList(uid: string, list: string[]): Promise<void> {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), { myList: list });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  async updateHistory(uid: string, history: Video[]): Promise<void> {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), { history });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },
  async updateSavedPlaylists(uid: string, list: string[]): Promise<void> {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), { savedPlaylists: list });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Resolve Link
  async resolveLink(url: string, type: 'video' | 'thumbnail'): Promise<string> {
    // For now, just return the URL. In a real app, you might have a backend for this.
    // Since we are moving to client-side Firebase, we'll just return the URL.
    return url;
  },

  async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. ");
      }
    }
  }
};
