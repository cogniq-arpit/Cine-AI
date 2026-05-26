import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Profile } from '../types';
import { authService } from '../services/api/authService';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasCompletedOnboarding: boolean;

  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (name: string, username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  loadSession: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signInAsGuest: () => void;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  hasCompletedOnboarding: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  loadSession: async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const storedUser = await AsyncStorage.getItem('user');
      const storedProfile = await AsyncStorage.getItem('profile');
      const isGuest = (await AsyncStorage.getItem('isGuest')) === 'true';
      const storedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');

      let hasCompletedOnboarding = storedOnboarding === 'true';

      if (accessToken && storedUser && storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        // Fallback: if they have already selected favorite genres previously, count onboarding as completed
        if (parsedProfile.favorite_genres && parsedProfile.favorite_genres.length > 0) {
          hasCompletedOnboarding = true;
        }

        set({
          user: JSON.parse(storedUser),
          profile: parsedProfile,
          isAuthenticated: true,
          isGuest: false,
          hasCompletedOnboarding,
        });
      } else if (isGuest) {
        get().signInAsGuest();
      }
    } catch (error) {
      console.error('Load session error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (identifier: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await authService.login(identifier, password);

      const user: User = {
        id: data.user.id,
        email: identifier.includes('@') ? identifier : `${data.user.username}@cineai.app`,
        created_at: new Date().toISOString(),
      };

      const profile: Profile = {
        id: `${data.user.id}_profile`,
        user_id: data.user.id,
        name: data.user.name,
        avatar_url: null,
        favorite_genres: [],
        preferred_languages: ['en'],
        streaming_platforms: [],
        ai_taste_profile: 'Cinematic AI Profile',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await AsyncStorage.setItem('accessToken', data.access_token);
      await AsyncStorage.setItem('refreshToken', data.refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('profile', JSON.stringify(profile));
      await AsyncStorage.setItem('isGuest', 'false');
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');

      set({ user, profile, isAuthenticated: true, isGuest: false, hasCompletedOnboarding: true });

    } catch (error) {
      console.error('Sign In error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (name: string, username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await authService.signup(name, username, email, password);

      const user: User = {
        id: data.user.id,
        email: email,
        created_at: new Date().toISOString(),
      };

      const profile: Profile = {
        id: `${data.user.id}_profile`,
        user_id: data.user.id,
        name: data.user.name,
        avatar_url: null,
        favorite_genres: [],
        preferred_languages: ['en'],
        streaming_platforms: [],
        ai_taste_profile: 'Cinematic AI Profile',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await AsyncStorage.setItem('accessToken', data.access_token);
      await AsyncStorage.setItem('refreshToken', data.refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('profile', JSON.stringify(profile));
      await AsyncStorage.setItem('isGuest', 'false');
      await AsyncStorage.setItem('hasCompletedOnboarding', 'false');

      set({ user, profile, isAuthenticated: true, isGuest: false, hasCompletedOnboarding: false });
    } catch (error) {
      console.error('Sign Up error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('profile');
      await AsyncStorage.setItem('isGuest', 'false');
      await AsyncStorage.setItem('hasCompletedOnboarding', 'false');
      set({ user: null, profile: null, isAuthenticated: false, isGuest: false, hasCompletedOnboarding: false });
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email: string) => {
    console.info(`Password recovery triggered for: ${email}`);
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { profile } = get();
    if (!profile) return;
    const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
    await AsyncStorage.setItem('profile', JSON.stringify(updatedProfile));
    set({ profile: updatedProfile });
  },

  signInAsGuest: () => {
    const guestUser: User = {
      id: 'guest',
      email: 'guest@cineai.app',
      created_at: new Date().toISOString(),
    };
    const guestProfile: Profile = {
      id: 'guest_profile',
      user_id: 'guest',
      name: 'Guest',
      favorite_genres: [],
      preferred_languages: ['en'],
      streaming_platforms: [],
      avatar_url: null,
      ai_taste_profile: 'Guest AI Taste Profile',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    AsyncStorage.setItem('isGuest', 'true');
    AsyncStorage.setItem('hasCompletedOnboarding', 'true'); // Guests bypass onboarding
    set({ user: guestUser, profile: guestProfile, isAuthenticated: true, isGuest: true, hasCompletedOnboarding: true, isLoading: false });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    set({ hasCompletedOnboarding: true });
  },
}));
