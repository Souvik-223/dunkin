import axios from 'axios';
import type { TripInput, TripPreset, TripPlanResult, TripHistoryItem } from '../types/trip';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const tripApi = {
  /**
   * Calculates route, stops, and multi-day ELD log sheets
   */
  async planTrip(input: TripInput): Promise<TripPlanResult> {
    const response = await api.post<{ success: boolean; data: TripPlanResult }>('/trips/plan/', input);
    return response.data.data;
  },

  /**
   * Fetches preset trip scenarios for quick evaluation
   */
  async getPresets(): Promise<TripPreset[]> {
    const response = await api.get<{ success: boolean; data: TripPreset[] }>('/trips/presets/');
    return response.data.data;
  },

  /**
   * Fetches recently calculated trips for the history tab
   */
  async getHistory(): Promise<TripHistoryItem[]> {
    const response = await api.get<{ success: boolean; data: TripHistoryItem[] }>('/trips/history/');
    return response.data.data;
  },

  /**
   * Fetches full cached payload of a previously saved trip by ID
   */
  async getTripById(tripId: number): Promise<TripPlanResult> {
    const response = await api.get<{ success: boolean; data: TripPlanResult }>(`/trips/${tripId}/`);
    return response.data.data;
  },

  /**
   * Deletes a trip from history
   */
  async deleteTrip(tripId: number): Promise<void> {
    await api.delete(`/trips/${tripId}/`);
  },

  /**
   * Health check for backend connectivity
   */
  async checkHealth(): Promise<{ status: string; database: string }> {
    const response = await api.get('/health/');
    return response.data;
  }
};

