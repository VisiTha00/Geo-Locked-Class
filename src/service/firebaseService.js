import {
  ref,
  set,
  get,
  push,
  remove,
  onValue,
  off,
  update,
} from "firebase/database";
import { database } from "../config/firebase";
import {
  SESSION_TYPES,
  SESSION_STATUS,
  SUBMISSION_STATUS,
  Session,
  AttendanceSession,
  VotingSession,
  QuizSession,
  AttendanceSubmission,
  VoteSubmission,
  QuizSubmission,
} from "../types/sessionTypes";

class FirebaseService {
  constructor() {
    this.listeners = [];
    this.activeSessionRef = ref(database, "activeSession");
    this.sessionsRef = ref(database, "sessions");
    this.submissionsRef = ref(database, "submissions");
  }

  async createSession(sessionData) {
    try {
      let session;
      switch (sessionData.type) {
        case SESSION_TYPES.QUIZ:
          session = new QuizSession(sessionData);
          break;
        case SESSION_TYPES.VOTING:
          session = new VotingSession(sessionData);
          break;
        case SESSION_TYPES.ATTENDANCE:
          session = new AttendanceSession(sessionData);
          break;
        default:
          session = new Session(sessionData);
      }

      const sessionRef = ref(database, `sessions/${session.id}`);
      await set(sessionRef, session);
      console.log("Session saved to Firebase successfully");

      return { success: true, session };
    } catch (error) {
      console.error("Error creating session:", error);
      return { success: false, error: error.message };
    }
  }

  async startSession(sessionId) {
    try {
      const sessionRef = ref(database, `sessions/${sessionId}`);
      const updates = {
        status: SESSION_STATUS.ACTIVE,
        startedAt: new Date().toISOString(),
      };
      await update(sessionRef, updates);
      console.log("Session status updated to ACTIVE");

      const session = await this.getSession(sessionId);
      if (session) {
        await set(this.activeSessionRef, session);
        console.log("Active session updated in Firebase");
      } else {
        console.error("Could not retrieve session to set as active");
      }

      return { success: true };
    } catch (error) {
      console.error("Error starting session:", error);
      return { success: false, error: error.message };
    }
  }

  async endSession(sessionId) {
    try {
      const sessionRef = ref(database, `sessions/${sessionId}`);
      const updates = {
        status: SESSION_STATUS.ENDED,
        endedAt: new Date().toISOString(),
      };
      await update(sessionRef, updates);

      await remove(this.activeSessionRef);

      return { success: true };
    } catch (error) {
      console.error("Error ending session:", error);
      return { success: false, error: error.message };
    }
  }

  async updateSession(updatedSessionData) {
    try {
      const sessionRef = ref(database, `sessions/${updatedSessionData.id}`);
      await set(sessionRef, updatedSessionData);

      if (updatedSessionData.status === SESSION_STATUS.ACTIVE) {
        await set(this.activeSessionRef, updatedSessionData);
      }
      return { success: true };
    } catch (error) {
      console.error("Error updating session:", error);
      return { success: false, error: error.message };
    }
  }

  async getSession(sessionId) {
    try {
      const sessionRef = ref(database, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      return snapshot.val();
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  async getActiveSession() {
    try {
      const snapshot = await get(this.activeSessionRef);
      return snapshot.val();
    } catch (error) {
      console.error("Error getting active session:", error);
      return null;
    }
  }

  addSessionListener(callback) {
    const listener = onValue(this.activeSessionRef, (snapshot) => {
      const session = snapshot.val();
      callback(session);
    });

    this.listeners.push({ callback, listener });
    console.log(
      "Session listener added, total listeners:",
      this.listeners.length
    );
    return listener;
  }

  removeSessionListener(callback) {
    const listenerIndex = this.listeners.findIndex(
      (l) => l.callback === callback
    );
    if (listenerIndex !== -1) {
      const { listener } = this.listeners[listenerIndex];
      off(this.activeSessionRef, "value", listener);
      this.listeners.splice(listenerIndex, 1);
    }
  }

  async submitAttendance(attendanceData) {
    try {
      const submission = new AttendanceSubmission(attendanceData);
      const submissionRef = ref(
        database,
        `submissions/attendance/${submission.id}`
      );
      await set(submissionRef, submission);

      const sessionRef = ref(
        database,
        `sessions/${submission.sessionId}/attendanceList`
      );
      const attendanceListRef = push(sessionRef);
      await set(attendanceListRef, {
        studentId: submission.studentId,
        studentName: submission.studentName,
        submittedAt: submission.submittedAt,
        isValid: submission.isValid,
      });

      return { success: true, submission };
    } catch (error) {
      console.error("Error submitting attendance:", error);
      return { success: false, error: error.message };
    }
  }

  async submitVote(voteData) {
    try {
      const submission = new VoteSubmission(voteData);
      const submissionRef = ref(
        database,
        `submissions/voting/${submission.id}`
      );
      await set(submissionRef, submission);

      const sessionRef = ref(
        database,
        `sessions/${submission.sessionId}/votes`
      );
      const voteRef = push(sessionRef);
      await set(voteRef, {
        studentId: submission.studentId,
        studentName: submission.studentName,
        selectedOptions: submission.selectedOptions,
        submittedAt: submission.submittedAt,
        isValid: submission.isValid,
      });

      return { success: true, submission };
    } catch (error) {
      console.error("Error submitting vote:", error);
      return { success: false, error: error.message };
    }
  }

  async submitQuiz(quizData) {
    try {
      const submission = new QuizSubmission(quizData);
      const submissionRef = ref(database, `submissions/quiz/${submission.id}`);
      await set(submissionRef, submission);

      const sessionRef = ref(
        database,
        `sessions/${submission.sessionId}/submissions`
      );
      const quizRef = push(sessionRef);
      await set(quizRef, {
        studentId: submission.studentId,
        studentName: submission.studentName,
        score: submission.score,
        totalMarks: submission.totalMarks,
        percentage: submission.percentage,
        submittedAt: submission.submittedAt,
        isValid: submission.isValid,
        appFocusEvents: submission.appFocusEvents,
      });

      return { success: true, submission };
    } catch (error) {
      console.error("Error submitting quiz:", error);
      return { success: false, error: error.message };
    }
  }

  async getSessionSubmissions(sessionId, type) {
    try {
      const submissionsRef = ref(database, `submissions/${type}`);
      const snapshot = await get(submissionsRef);
      const allSubmissions = snapshot.val() || {};

      const sessionSubmissions = Object.values(allSubmissions).filter(
        (submission) => submission.sessionId === sessionId
      );

      return sessionSubmissions;
    } catch (error) {
      console.error("Error getting session submissions:", error);
      return [];
    }
  }

  async getSessionReportData(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return null;

      const reportData = {
        session: session,
        attendance: await this.getSessionSubmissions(sessionId, "attendance"),
        voting: await this.getSessionSubmissions(sessionId, "voting"),
        quiz: await this.getSessionSubmissions(sessionId, "quiz"),
      };

      return reportData;
    } catch (error) {
      console.error("Error getting session report data:", error);
      return null;
    }
  }

  async syncOfflineSubmissions(offlineSubmissions) {
    const results = [];

    for (const submission of offlineSubmissions) {
      try {
        let result;
        switch (submission.type) {
          case "attendance":
            result = await this.submitAttendance(submission.data);
            break;
          case "voting":
            result = await this.submitVote(submission.data);
            break;
          case "quiz":
            result = await this.submitQuiz(submission.data);
            break;
          default:
            result = { success: false, error: "Unknown submission type" };
        }

        results.push({
          id: submission.id,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        results.push({
          id: submission.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  cleanup() {
    this.listeners.forEach(({ listener }) => {
      off(this.activeSessionRef, "value", listener);
    });
    this.listeners = [];
  }
}

const firebaseService = new FirebaseService();

export default firebaseService;
