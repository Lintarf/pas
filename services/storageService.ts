import { IdCardData } from '../types';

const STORAGE_PREFIX = 'scan_data_';

export const storageService = {
  async saveIdCardData(data: IdCardData): Promise<void> {
    const date = new Date(data.scanTimestamp);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const storageKey = STORAGE_PREFIX + dateKey;

    try {
      // Read existing data or create empty array
      let existingData: IdCardData[] = [];
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        existingData = JSON.parse(storedData);
      }

      // Add new data and sort by timestamp (newest first)
      existingData.push(data);
      existingData.sort((a, b) => b.scanTimestamp - a.scanTimestamp);

      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(existingData));
    } catch (error) {
      console.error('Error saving scan data:', error);
      throw error;
    }
  },

  async loadIdCardData(startDate?: Date, endDate?: Date): Promise<IdCardData[]> {
    try {
      const allData: IdCardData[] = [];

      // Get all keys from localStorage that match our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const storedData = localStorage.getItem(key);
          if (storedData) {
            const fileData: IdCardData[] = JSON.parse(storedData);
            allData.push(...fileData);
          }
        }
      }

      // Filter by date range if provided
      let filteredData = allData;
      if (startDate || endDate) {
        const start = startDate ? startDate.getTime() : 0;
        const end = endDate ? endDate.getTime() : Date.now();
        filteredData = allData.filter(data => {
          return data.scanTimestamp >= start && data.scanTimestamp <= end;
        });
      }

      // Sort by timestamp (newest first)
      return filteredData.sort((a, b) => b.scanTimestamp - a.scanTimestamp);
    } catch (error) {
      console.error('Error loading scan data:', error);
      return [];
    }
  }
};