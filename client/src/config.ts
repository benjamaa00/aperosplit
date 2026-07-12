// Configuration for mobile app
export const CONFIG = {
  // Backend server URL - change this to your deployed backend
  // For local development: 'http://localhost:3000'
  // For production: 'https://your-backend-url.com'
  API_URL: import.meta.env.VITE_API_URL || window.location.origin,
  
  // Enable real-time sync
  ENABLE_REALTIME_SYNC: true,
  
  // Sync interval in milliseconds
  SYNC_INTERVAL: 5000,
};
