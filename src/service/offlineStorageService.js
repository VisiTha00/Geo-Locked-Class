import AsyncStorage from "@react-native-async-storage/async-storage";
import { OfflineSubmission } from "../types/sessionTypes";

class OfflineStorageService {
  constructor() {
    this.STORAGE_KEYS = {
      OFFLINE_SUBMISSIONS: "offline_submissions",
      USER_DATA: "user_data",
      SESSION_CACHE: "session_cache",
      SETTINGS: "app_settings",
    };
  }

  async saveOfflineSubmission(submission) {
    try {
      const existingSubmissions = await this.getOfflineSubmissions();
      const newSubmission = new OfflineSubmission(submission);

      existingSubmissions.push(newSubmission);
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_SUBMISSIONS,
        JSON.stringify(existingSubmissions)
      );

      return { success: true, submission: newSubmission };
    } catch (error) {
      console.error("Error saving offline submission:", error);
      return { success: false, error: error.message };
    }
  }

  async getOfflineSubmissions() {
    try {
      const data = await AsyncStorage.getItem(
        this.STORAGE_KEYS.OFFLINE_SUBMISSIONS
      );
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting offline submissions:", error);
      return [];
    }
  }

  async getUnsyncedSubmissions() {
    try {
      const submissions = await this.getOfflineSubmissions();
      return submissions.filter((submission) => !submission.synced);
    } catch (error) {
      console.error("Error getting unsynced submissions:", error);
      return [];
    }
  }

  async markSubmissionAsSynced(submissionId) {
    try {
      const submissions = await this.getOfflineSubmissions();
      const updatedSubmissions = submissions.map((submission) =>
        submission.id === submissionId
          ? { ...submission, synced: true }
          : submission
      );

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_SUBMISSIONS,
        JSON.stringify(updatedSubmissions)
      );

      return { success: true };
    } catch (error) {
      console.error("Error marking submission as synced:", error);
      return { success: false, error: error.message };
    }
  }

  async removeSyncedSubmissions() {
    try {
      const submissions = await this.getOfflineSubmissions();
      const unsyncedSubmissions = submissions.filter(
        (submission) => !submission.synced
      );

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_SUBMISSIONS,
        JSON.stringify(unsyncedSubmissions)
      );

      return { success: true };
    } catch (error) {
      console.error("Error removing synced submissions:", error);
      return { success: false, error: error.message };
    }
  }

  async cacheSession(session) {
    try {
      const cacheKey = `${this.STORAGE_KEYS.SESSION_CACHE}_${session.id}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(session));
      return { success: true };
    } catch (error) {
      console.error("Error caching session:", error);
      return { success: false, error: error.message };
    }
  }

  async getCachedSession(sessionId) {
    try {
      const cacheKey = `${this.STORAGE_KEYS.SESSION_CACHE}_${sessionId}`;
      const data = await AsyncStorage.getItem(cacheKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting cached session:", error);
      return null;
    }
  }

  async clearSessionCache(sessionId) {
    try {
      const cacheKey = `${this.STORAGE_KEYS.SESSION_CACHE}_${sessionId}`;
      await AsyncStorage.removeItem(cacheKey);
      return { success: true };
    } catch (error) {
      console.error("Error clearing session cache:", error);
      return { success: false, error: error.message };
    }
  }

  async saveUserData(userData) {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_DATA,
        JSON.stringify(userData)
      );
      return { success: true };
    } catch (error) {
      console.error("Error saving user data:", error);
      return { success: false, error: error.message };
    }
  }

  async getUserData() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings)
      );
      return { success: true };
    } catch (error) {
      console.error("Error saving settings:", error);
      return { success: false, error: error.message };
    }
  }

  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return data
        ? JSON.parse(data)
        : {
            locationAccuracy: "high",
            autoSync: true,
            notifications: true,
            offlineMode: false,
          };
    } catch (error) {
      console.error("Error getting settings:", error);
      return {
        locationAccuracy: "high",
        autoSync: true,
        notifications: true,
        offlineMode: false,
      };
    }
  }

  async syncWithServer(firebaseService) {
    try {
      const unsyncedSubmissions = await this.getUnsyncedSubmissions();

      if (unsyncedSubmissions.length === 0) {
        return { success: true, message: "No submissions to sync" };
      }

      const results = await firebaseService.syncOfflineSubmissions(
        unsyncedSubmissions
      );

      for (const result of results) {
        if (result.success) {
          await this.markSubmissionAsSynced(result.id);
        }
      }

      await this.removeSyncedSubmissions();

      return {
        success: true,
        syncedCount: results.filter((r) => r.success).length,
        totalCount: results.length,
      };
    } catch (error) {
      console.error("Error syncing with server:", error);
      return { success: false, error: error.message };
    }
  }

  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.OFFLINE_SUBMISSIONS,
        this.STORAGE_KEYS.USER_DATA,
        this.STORAGE_KEYS.SESSION_CACHE,
        this.STORAGE_KEYS.SETTINGS,
      ]);
      return { success: true };
    } catch (error) {
      console.error("Error clearing all data:", error);
      return { success: false, error: error.message };
    }
  }

  async getStorageStats() {
    try {
      const submissions = await this.getOfflineSubmissions();
      const unsynced = await this.getUnsyncedSubmissions();

      return {
        totalSubmissions: submissions.length,
        unsyncedSubmissions: unsynced.length,
        syncedSubmissions: submissions.length - unsynced.length,
        storageUsed: await this.getStorageSize(),
      };
    } catch (error) {
      console.error("Error getting storage stats:", error);
      return null;
    }
  }

  async getStorageSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error("Error calculating storage size:", error);
      return 0;
    }
  }
}

const offlineStorageService = new OfflineStorageService();

export default offlineStorageService;
