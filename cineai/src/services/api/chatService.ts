import { apiClient } from './apiClient';

export interface ChatMessageResponse {
  id: string;
  session_token: string;
  message_role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface VoiceSessionResponse {
  id: string;
  transcript: string;
  response_text: string;
  duration: number;
  audio_url: string | null;
  created_at: string;
}

export interface ChatDiagnosticsResponse {
  provider: string;
  model: string;
  base_url: string;
  api_key_configured: boolean;
  api_key_length: number;
  timeout_seconds: number;
}

export const chatService = {
  /**
   * Submits a user prompt message to the chatbot.
   */
  postMessage: async (sessionToken: string, prompt: string): Promise<ChatMessageResponse> => {
    const response = await apiClient.post<ChatMessageResponse>('/chat/message', {
      session_token: sessionToken,
      prompt,
    });
    return response.data;
  },

  /**
   * Submits a guest prompt message to the secure chatbot proxy.
   */
  postGuestMessage: async (prompt: string, context: { role: string; content: string }[]): Promise<{ content: string }> => {
    const response = await apiClient.post<{ content: string }>('/chat/guest/message', {
      prompt,
      context,
    });
    return response.data;
  },


  /**
   * Retrieves chatbot conversation log history for a specific persistent session token.
   */
  getHistory: async (sessionToken: string): Promise<ChatMessageResponse[]> => {
    const response = await apiClient.get<ChatMessageResponse[]>(`/chat/history/${sessionToken}`);
    return response.data;
  },

  getDiagnostics: async (): Promise<ChatDiagnosticsResponse> => {
    const response = await apiClient.get<ChatDiagnosticsResponse>('/chat/diagnostics');
    return response.data;
  },

  /**
   * Fetches voice telemetry sessions for the current authenticated profile.
   */
  getVoiceSessions: async (): Promise<VoiceSessionResponse[]> => {
    const response = await apiClient.get<VoiceSessionResponse[]>('/voice/sessions');
    return response.data;
  },

  /**
   * Submits mood-based queries and returns matching movie lists from Gemini.
   */
  getRecommendations: async (moodPrompt: string): Promise<any[]> => {
    const response = await apiClient.post<any[]>('/recommendations', {
      mood_prompt: moodPrompt,
    });
    return response.data;
  },
};
