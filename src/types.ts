export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  createdAt: number;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  watchedAt?: number;
  progress?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  isOnline?: boolean;
  lastActive?: number;
  sessionStart?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  videoIds: string[];
  createdAt: number;
  authorId: string;
  thumbnailUrl?: string;
}

export interface AppSettings {
  appName: string;
  appLogo: string;
  appDetails: string;
  updatedAt: number;
  updatedBy: string;
}
