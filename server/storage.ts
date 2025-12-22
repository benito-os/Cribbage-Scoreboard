// Storage interface for the Pepper scorekeeping app
// Note: This app primarily uses client-side localStorage for game state persistence
// The backend is minimal and used only for serving the application

export interface IStorage {
  // Placeholder for future server-side storage if needed
}

export class MemStorage implements IStorage {
  constructor() {
    // No server-side storage needed for this app
    // Game state is managed entirely on the client via localStorage
  }
}

export const storage = new MemStorage();
