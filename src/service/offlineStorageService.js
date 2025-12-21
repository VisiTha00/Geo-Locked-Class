import AsyncStorage from "@react-native-async-storage/async-storage";
import { OfflineSubmission } from "../types/sessionTypes";

class OfflineStorageService {
  constructor() {
    this.STORAGE_KEYS = {
      OFFLINE_SUBMISSIONS: "offline_submissions",
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

  async syncWithServer(firebaseService) {
    try {
      const unsyncedSubmissions = await this.getUnsyncedSubmissions();

      if (unsyncedSubmissions.length === 0) {
        return { success: true, message: "No submissions to sync" };
      }

      const results =
        await firebaseService.syncOfflineSubmissions(unsyncedSubmissions);

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
      await AsyncStorage.removeItem([this.STORAGE_KEYS.OFFLINE_SUBMISSIONS]);
      return { success: true };
    } catch (error) {
      console.error("Error clearing all data:", error);
      return { success: false, error: error.message };
    }
  }
}

const offlineStorageService = new OfflineStorageService();

export default offlineStorageService;
