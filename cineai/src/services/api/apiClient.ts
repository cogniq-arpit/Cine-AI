import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In Expo SDK 54, process.env loads environment variables declared with EXPO_PUBLIC_
const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Dynamic fallback based on platform
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://127.0.0.1:8000/api/v1';
};

const API_URL = getBaseURL();
console.log('--- [DEBUG] Cine AI Frontend API Base URL:', API_URL);


export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const OFFLINE_ACCESS_TOKEN = 'offline_access_token';
const OFFLINE_REFRESH_TOKEN = 'offline_refresh_token';

const isUsableToken = (token: string | null): token is string => {
  return Boolean(token && token !== OFFLINE_ACCESS_TOKEN && token !== OFFLINE_REFRESH_TOKEN);
};

const clearStoredSessionTokens = async () => {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const backendStatusHolder = {
  status: 'SLEEPING' as 'SLEEPING' | 'AWAKE'
};

// ─── REQUEST INTERCEPTOR: Inject Access Token ──────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // If backend is sleeping/cold-starting, enforce a strict 3.5s timeout for normal requests so fallbacks trigger instantly
    // We bypass this for background health checks so they can successfully wake up the sleeping Render server.
    if (backendStatusHolder.status === 'SLEEPING' && !config.headers?.['X-Health-Check']) {
      config.timeout = 3500;
    }
    const token = await AsyncStorage.getItem('accessToken');
    if (isUsableToken(token) && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR: Token Refresh Rotation & Session Recovery ─────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestHadAuthHeader = Boolean(originalRequest?.headers?.Authorization);

    // Check if error is unauthorized (token expired) and request hasn't retried yet
    if (error.response?.status === 401 && originalRequest && requestHadAuthHeader && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!isUsableToken(refreshToken)) {
          await clearStoredSessionTokens();
          processQueue(error, null);
          isRefreshing = false;
          return Promise.reject(error);
        }

        // Call the refresh endpoint on the backend
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;

        // Save rotated token pair
        await AsyncStorage.setItem('accessToken', access_token);
        await AsyncStorage.setItem('refreshToken', refresh_token);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Revoke session on failure
        await clearStoredSessionTokens();
        await AsyncStorage.removeItem('user');

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
