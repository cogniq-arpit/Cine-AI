import { create } from 'zustand';
import { apiClient, backendStatusHolder } from '../services/api/apiClient';

interface BackendStatusState {
  status: 'SLEEPING' | 'AWAKE';
  checkCount: number;
  setStatus: (status: 'SLEEPING' | 'AWAKE') => void;
  initializeStatus: () => void;
  triggerWakeUp: () => Promise<void>;
}

export const useBackendStatusStore = create<BackendStatusState>((set, get) => {
  let pollingInterval: any = null;

  return {
    status: 'SLEEPING',
    checkCount: 0,
    setStatus: (status) => {
      backendStatusHolder.status = status;
      set({ status });
    },
    
    initializeStatus: () => {
      // Start background wake and health check
      get().triggerWakeUp();
    },

    triggerWakeUp: async () => {
      console.log('[WakeUp] Silent background health check started...');
      
      const checkHealth = async () => {
        try {
          // Perform a fast 3-second ping to the movies API to test response latency
          const res = await apiClient.get('/movies/trending', { 
            timeout: 3000,
            headers: { 'X-Health-Check': 'true' }
          });
          if (res && res.status === 200) {
            console.log('[WakeUp] Primary backend is fully AWAKE!');
            backendStatusHolder.status = 'AWAKE';
            set({ status: 'AWAKE' });
            if (pollingInterval) {
              clearInterval(pollingInterval);
              pollingInterval = null;
            }
            return true;
          }
        } catch (error) {
          // Silent catch - server is sleeping or booting
        }
        return false;
      };

      // Check immediately on startup
      const isAwake = await checkHealth();
      if (isAwake) return;

      // Start non-blocking background retry loop every 5 seconds until awake
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(async () => {
        set(state => ({ checkCount: state.checkCount + 1 }));
        const awake = await checkHealth();
        if (awake) {
          console.log('[WakeUp] Seamless switch back to primary backend active.');
        }
      }, 5000);
    }
  };
});
