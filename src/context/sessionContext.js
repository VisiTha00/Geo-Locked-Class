import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import FirebaseService from "../service/firebaseService";
import offlineStorageService from "../service/OfflineStorageService";
import appFocusService from "../service/appFocusService";
import { SESSION_STATUS, SUBMISSION_STATUS } from "../types/sessionTypes";

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLocation, setSessionLocation] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isInRange, setIsInRange] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    const handleSessionUpdate = (session) => {
      if (session && session.status === SESSION_STATUS.ACTIVE) {
        setActiveSession(session);
        setSessionLocation(session.location);
        setIsSessionActive(true);
        setSessionExpired(false);
        setHasSubmitted(false);
        startSessionTimer(session);
      } else {
        console.log("Clearing active session");
        setActiveSession(null);
        setSessionLocation(null);
        setIsSessionActive(false);
        setSessionTimer(0);
      }
    };

    console.log("Adding Firebase session listener");
    FirebaseService.addSessionListener(handleSessionUpdate);

    startLocationMonitoring();

    checkOfflineStatus();

    return () => {
      FirebaseService.removeSessionListener(handleSessionUpdate);
      appFocusService.cleanup();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (userLocation && sessionLocation) {
      console.log("Recalculating range - User location:", userLocation);
      console.log("Recalculating range - Session location:", sessionLocation);
      const inRange = checkLocationInRange(userLocation, sessionLocation);
      console.log("Range calculation result:", inRange);
      setIsInRange(inRange);
    } else if (sessionLocation && !userLocation) {
      console.log("Session location available but user location not ready yet");
      setIsInRange(false);
    }
  }, [userLocation, sessionLocation]);

  useEffect(() => {
    if (isSessionActive && sessionLocation && userLocation) {
      console.log("Session became active, forcing range recalculation");
      const inRange = checkLocationInRange(userLocation, sessionLocation);
      console.log("Active session range check result:", inRange);
      setIsInRange(inRange);
    }
  }, [isSessionActive, sessionLocation, userLocation]);

  const startLocationMonitoring = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log("Initial location obtained:", location.coords);
      setUserLocation(location.coords);

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 3,
        },
        (location) => {
          console.log("Location updated:", location.coords);
          setUserLocation(location.coords);
        }
      );
    } catch (error) {
      console.error("Error starting location monitoring:", error);
    }
  };

  const checkOfflineStatus = async () => {
    try {
      const response = await fetch("https://www.google.com", {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
      });
      setIsOffline(false);
    } catch (error) {
      setIsOffline(true);
    }
  };

  const startSessionTimer = (session) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!session.startedAt) {
      console.error("Session has no startedAt time:", session);
      return;
    }

    const startTime = new Date(session.startedAt).getTime();
    const timeLimit = session.timeLimit * 1000;
    const endTime = startTime + timeLimit;
    const currentTime = Date.now();
    const timeUntilEnd = Math.floor((endTime - currentTime) / 1000);

    console.log("Starting session timer:", {
      startTime: new Date(startTime).toISOString(),
      timeLimit: session.timeLimit,
      endTime: new Date(endTime).toISOString(),
      currentTime: new Date(currentTime).toISOString(),
      timeUntilEnd: timeUntilEnd,
    });

    setSessionTimer(timeUntilEnd);

    if (timeUntilEnd <= 0) {
      console.log("Session has already expired, setting timer to 0");
      setSessionTimer(0);
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      if (remaining % 10 === 0 || remaining <= 10) {
        console.log("Timer update:", {
          remaining,
          endTime: new Date(endTime).toISOString(),
          currentTime: new Date(now).toISOString(),
        });
      }

      setSessionTimer(remaining);

      if (remaining <= 0) {
        console.log("Session time limit reached, clearing timer");
        clearInterval(timer);
        timerIntervalRef.current = null;
        handleSessionTimeLimit();
      }
    }, 1000);

    timerIntervalRef.current = timer;
  };

  const handleSessionTimeLimit = async () => {
    setSessionExpired(true);
    if (activeSession && activeSession.type) {
      try {
        console.log("Session expired - students should auto-submit");
      } catch (error) {
        console.error("Error handling session time limit:", error);
      }
    }
  };

  const checkLocationInRange = (userLoc, sessionLoc) => {
    if (!userLoc || !sessionLoc) {
      console.log("Location validation failed - missing location data");
      return false;
    }

    const R = 6371e3;
    const φ1 = (userLoc.latitude * Math.PI) / 180;
    const φ2 = (sessionLoc.latitude * Math.PI) / 180;
    const Δφ = ((sessionLoc.latitude - userLoc.latitude) * Math.PI) / 180;
    const Δλ = ((sessionLoc.longitude - userLoc.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    const isInRange = distance <= sessionLoc.radius;

    console.log("Location validation details:");
    console.log("- User location:", userLoc.latitude, userLoc.longitude);
    console.log(
      "- Session location:",
      sessionLoc.latitude,
      sessionLoc.longitude
    );
    console.log("- Session radius:", sessionLoc.radius, "meters");
    console.log("- Calculated distance:", distance.toFixed(2), "meters");
    console.log("- Is in range:", isInRange);

    return isInRange;
  };

  const createSession = async (sessionData) => {
    try {
      console.log("Creating session with data:", sessionData);
      const result = await FirebaseService.createSession(sessionData);

      if (result.success) {
        console.log("Session created successfully, starting session...");
        const startResult = await FirebaseService.startSession(
          result.session.id
        );
        if (startResult.success) {
          console.log("Session started successfully, sending notifications...");
          // Send notification to teacher only (students will get notified via Firebase listener)
          await sendTeacherNotification(result.session.id, result.session.type);
          console.log("Teacher notification sent");
        } else {
          console.error("Failed to start session:", startResult.error);
        }
      }

      return result;
    } catch (error) {
      console.error("Error creating session:", error);
      return { success: false, error: error.message };
    }
  };

  const startSession = async (sessionId) => {
    try {
      const result = await FirebaseService.startSession(sessionId);
      if (result.success) {
        // Send notification to students
        await sendSessionNotification(sessionId);
      }
      return result;
    } catch (error) {
      console.error("Error starting session:", error);
      return { success: false, error: error.message };
    }
  };

  const endSession = async (sessionId) => {
    try {
      const result = await FirebaseService.endSession(sessionId);
      if (result.success) {
        // Clear local session state
        setActiveSession(null);
        setSessionLocation(null);
        setIsSessionActive(false);
        setSessionTimer(0);
        setHasSubmitted(false);
        setSessionExpired(false);
      }
      return result;
    } catch (error) {
      console.error("Error ending session:", error);
      return { success: false, error: error.message };
    }
  };

  const updateSession = async (updatedSessionData) => {
    try {
      const result = await FirebaseService.updateSession(updatedSessionData);
      if (result.success) {
        // Update local session state
        setActiveSession(updatedSessionData);
        setSessionLocation(updatedSessionData.location);

        // Restart timer with new time limit
        if (updatedSessionData.startedAt) {
          startSessionTimer(updatedSessionData);
        }
      }
      return result;
    } catch (error) {
      console.error("Error updating session:", error);
      return { success: false, error: error.message };
    }
  };

  // Attendance Management
  const submitAttendance = async (sessionId, studentData) => {
    try {
      const isValid = checkLocationInRange(userLocation, sessionLocation);
      const isWithinTimeLimit = sessionTimer > 0;

      const attendanceData = {
        sessionId,
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        universityId: studentData.universityId,
        location: userLocation,
        isValid: isValid && isWithinTimeLimit,
        status:
          isValid && isWithinTimeLimit
            ? SUBMISSION_STATUS.SUBMITTED
            : SUBMISSION_STATUS.INVALID,
        notes: !isValid
          ? "Outside geo-fence"
          : !isWithinTimeLimit
          ? "Time limit exceeded"
          : "",
      };

      if (isOffline) {
        // Save to offline storage
        const result = await offlineStorageService.saveOfflineSubmission({
          type: "attendance",
          data: attendanceData,
        });
        return result;
      } else {
        // Submit directly to Firebase
        const result = await FirebaseService.submitAttendance(attendanceData);

        // Submission completed successfully
        if (result.success) {
          markAsSubmitted();
        }

        return result;
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      return { success: false, error: error.message };
    }
  };

  // Voting Management
  const submitVote = async (sessionId, studentData, selectedOptions) => {
    try {
      const isValid = checkLocationInRange(userLocation, sessionLocation);
      const isWithinTimeLimit = sessionTimer > 0;

      const voteData = {
        sessionId,
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        universityId: studentData.universityId,
        selectedOptions,
        location: userLocation,
        isValid: isValid && isWithinTimeLimit,
        status:
          isValid && isWithinTimeLimit
            ? SUBMISSION_STATUS.SUBMITTED
            : SUBMISSION_STATUS.INVALID,
      };

      if (isOffline) {
        const result = await offlineStorageService.saveOfflineSubmission({
          type: "voting",
          data: voteData,
        });
        return result;
      } else {
        const result = await FirebaseService.submitVote(voteData);

        // Submission completed successfully
        if (result.success) {
          markAsSubmitted();
        }

        return result;
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
      return { success: false, error: error.message };
    }
  };

  // Quiz Management
  const submitQuiz = async (sessionId, studentData, answers) => {
    try {
      const isValid = checkLocationInRange(userLocation, sessionLocation);
      const isWithinTimeLimit = sessionTimer > 0;

      // Calculate score
      const score = calculateQuizScore(answers, activeSession.questions);
      const totalMarks = activeSession.questions.reduce(
        (sum, q) => sum + q.marks,
        0
      );
      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

      const quizData = {
        sessionId,
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        universityId: studentData.universityId,
        answers,
        location: userLocation,
        isValid: isValid && isWithinTimeLimit,
        status:
          isValid && isWithinTimeLimit
            ? SUBMISSION_STATUS.SUBMITTED
            : SUBMISSION_STATUS.INVALID,
        score,
        totalMarks,
        percentage,
        appFocusEvents: appFocusService.getFocusEvents(),
        timeSpent: activeSession.timeLimit * 1000 - sessionTimer,
      };

      if (isOffline) {
        const result = await offlineStorageService.saveOfflineSubmission({
          type: "quiz",
          data: quizData,
        });
        return result;
      } else {
        const result = await FirebaseService.submitQuiz(quizData);

        // Submission completed successfully
        if (result.success) {
          markAsSubmitted();
        }

        return result;
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      return { success: false, error: error.message };
    }
  };

  // Quiz scoring
  const calculateQuizScore = (answers, questions) => {
    let score = 0;
    console.log("Calculating quiz score:");
    console.log("Answers:", answers);
    console.log("Questions:", questions);
    console.log(
      "Question IDs in questions:",
      questions.map((q) => ({ id: q.id, type: typeof q.id }))
    );
    console.log(
      "Question IDs in answers:",
      answers.map((a) => ({
        questionId: a.questionId,
        type: typeof a.questionId,
      }))
    );

    answers.forEach((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (question && answer.answer === question.correctAnswer) {
        score += question.marks;
        console.log(`Correct! Added ${question.marks} marks. Total: ${score}`);
      } else {
        console.log(`Incorrect. No marks added. Total: ${score}`);
      }
    });

    console.log(`Final score: ${score}`);
    return score;
  };

  // App focus monitoring for quizzes
  const startQuizMonitoring = (questionId, onAutoSubmit) => {
    // Set up auto-submit callback if provided
    if (onAutoSubmit) {
      appFocusService.setAutoSubmitCallback(onAutoSubmit);
    }
    appFocusService.startMonitoring(questionId);
  };

  const stopQuizMonitoring = () => {
    appFocusService.stopMonitoring();
  };

  const getQuizIntegrityReport = () => {
    return appFocusService.isSuspiciousBehavior();
  };

  const setQuizBlockingEnabled = (enabled) => {
    appFocusService.setBlockingEnabled(enabled);
  };

  const setQuizWarningEnabled = (enabled) => {
    appFocusService.setWarningEnabled(enabled);
  };

  const setQuizAutoSubmitEnabled = (enabled) => {
    appFocusService.setAutoSubmitEnabled(enabled);
  };

  const setQuizMaxWarnings = (maxWarnings) => {
    appFocusService.setMaxWarnings(maxWarnings);
  };

  const setQuizSuspiciousThreshold = (threshold) => {
    appFocusService.setSuspiciousThreshold(threshold);
  };

  const getQuizWarningCount = () => {
    return appFocusService.getWarningCount();
  };

  const resetQuizWarnings = () => {
    appFocusService.resetWarnings();
  };

  // Offline sync
  const syncOfflineData = async () => {
    try {
      const result = await offlineStorageService.syncWithServer(
        FirebaseService
      );
      return result;
    } catch (error) {
      console.error("Error syncing offline data:", error);
      return { success: false, error: error.message };
    }
  };

  // Notifications - Send to students only
  const sendSessionNotification = async (sessionId) => {
    try {
      console.log("Sending notification for session:", sessionId);

      // Request notification permissions first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          console.log("Notification permission denied");
          return;
        }
      }

      // Send notification to students only
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎓 Class Session Started!",
          body: "A new class session has started. Check if you're in range to join.",
          data: { sessionId, type: "session_started", target: "students" },
          sound: true,
        },
        trigger: null, // Send immediately
      });

      console.log("Student notification sent successfully");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // Send notification to teacher
  const sendTeacherNotification = async (sessionId, sessionType) => {
    try {
      console.log("Sending teacher notification for session:", sessionId);

      // Request notification permissions first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          console.log("Notification permission denied");
          return;
        }
      }

      // Send notification to teacher
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Session Created & Started!",
          body: `Your ${sessionType} session is now active and students have been notified.`,
          data: { sessionId, type: "session_created", target: "teacher" },
          sound: true,
        },
        trigger: null, // Send immediately
      });

      console.log("Teacher notification sent successfully");
    } catch (error) {
      console.error("Error sending teacher notification:", error);
    }
  };

  // Force range check (useful for manual refresh)
  const forceRangeCheck = () => {
    if (userLocation && sessionLocation) {
      console.log("Force range check triggered");
      const inRange = checkLocationInRange(userLocation, sessionLocation);
      console.log("Force range check result:", inRange);
      setIsInRange(inRange);
      return inRange;
    }
    console.log("Cannot force range check - missing location data");
    return false;
  };

  // Utility functions
  const getSessionTimeRemaining = () => {
    return Math.max(0, sessionTimer);
  };

  const isSessionExpired = () => {
    return sessionExpired || sessionTimer <= 0;
  };

  const canSubmit = () => {
    return isInRange && !isSessionExpired() && isSessionActive && !hasSubmitted;
  };

  const markAsSubmitted = () => {
    setHasSubmitted(true);
  };

  const isSubmitted = () => {
    return hasSubmitted;
  };

  const value = {
    // Session state
    activeSession,
    sessionLocation,
    isSessionActive,
    userLocation,
    isInRange,
    sessionTimer,
    isOffline,

    // Session management
    createSession,
    startSession,
    endSession,
    updateSession,

    // Submissions
    submitAttendance,
    submitVote,
    submitQuiz,

    // Quiz monitoring
    startQuizMonitoring,
    stopQuizMonitoring,
    getQuizIntegrityReport,
    setQuizBlockingEnabled,
    setQuizWarningEnabled,
    setQuizAutoSubmitEnabled,
    setQuizMaxWarnings,
    setQuizSuspiciousThreshold,
    getQuizWarningCount,
    resetQuizWarnings,

    // Offline sync
    syncOfflineData,

    // Notifications
    sendSessionNotification,
    sendTeacherNotification,

    // Utilities
    getSessionTimeRemaining,
    isSessionExpired,
    canSubmit,
    checkLocationInRange,
    forceRangeCheck,
    markAsSubmitted,
    isSubmitted,
    sessionExpired,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
