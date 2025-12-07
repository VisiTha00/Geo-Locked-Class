import { AppState, Alert, BackHandler } from "react-native";
import * as Notifications from "expo-notifications";

class AppFocusService {
  constructor() {
    this.isMonitoring = false;
    this.focusEvents = [];
    this.currentQuestionId = null;
    this.startTime = null;
    this.appStateSubscription = null;
    this.backHandler = null;
    this.suspiciousThreshold = 2;
    this.maxSwitchTime = 3000;
    this.warningCount = 0;
    this.maxWarnings = 3;
    this.blockingEnabled = true;
    this.warningEnabled = true;
    this.autoSubmitEnabled = true;
    this.pendingAutoSubmit = false;
  }

  startMonitoring(questionId) {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.isMonitoring = true;
    this.currentQuestionId = questionId;
    this.startTime = Date.now();
    this.focusEvents = [];
    this.warningCount = 0;
    this.pendingAutoSubmit = false;

    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        this.handleAppStateChange(nextAppState);
      }
    );

    if (this.blockingEnabled) {
      this.backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          this.handleBackButtonPress();
          return true;
        }
      );
    }
  }

  stopMonitoring() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.backHandler) {
      this.backHandler.remove();
      this.backHandler = null;
    }

    this.isMonitoring = false;
    this.currentQuestionId = null;
    this.startTime = null;
    this.warningCount = 0;

    console.log("App focus monitoring stopped");
  }

  handleAppStateChange(nextAppState) {
    if (!this.isMonitoring) {
      console.log("App state changed but monitoring is not active");
      return;
    }

    const currentTime = Date.now();
    const event = {
      timestamp: currentTime,
      state: nextAppState,
      questionId: this.currentQuestionId,
      timeFromStart: this.startTime ? currentTime - this.startTime : 0,
    };

    this.focusEvents.push(event);

    if (nextAppState === "background" || nextAppState === "inactive") {
      this.handleAppFocusLoss();
    } else if (nextAppState === "active") {
      if (this.pendingAutoSubmit) {
        this.pendingAutoSubmit = false;
        this.handleMaxWarningsReached();
      }
    }
  }

  handleBackButtonPress() {
    this.showWarningDialog(
      "Quiz in Progress",
      "You cannot leave the quiz while it's in progress. This action will be recorded.",
      "Stay in Quiz",
      "Leave Quiz (Warning)"
    );
  }

  handleAppFocusLoss() {
    console.log(
      `Current warning count: ${this.warningCount}, Max warnings: ${this.maxWarnings}`
    );

    this.warningCount++;
    console.log(`Warning count incremented to: ${this.warningCount}`);

    if (this.warningEnabled && this.warningCount <= this.maxWarnings) {
      this.showWarningNotification();
    }

    if (this.autoSubmitEnabled && this.warningCount > this.maxWarnings) {
      console.log("Max warnings exceeded - setting pending auto-submit");
      this.pendingAutoSubmit = true;
      return;
    }
  }

  async showWarningNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚠️ Quiz Integrity Warning",
          body: `App switching detected! Warning ${this.warningCount}/${this.maxWarnings}. Stay focused on the quiz.`,
          data: { type: "quiz_warning", warningCount: this.warningCount },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error showing warning notification:", error);
    }
  }

  showWarningDialog(title, message, stayButton, leaveButton) {
    Alert.alert(
      title,
      message,
      [
        {
          text: stayButton,
          style: "default",
          onPress: () => {
            console.log("User chose to stay in quiz");
          },
        },
        {
          text: leaveButton,
          style: "destructive",
          onPress: () => {
            console.log("User chose to leave quiz despite warning");
            this.warningCount++;
            this.handleAppFocusLoss();
          },
        },
      ],
      { cancelable: false }
    );
  }

  handleMaxWarningsReached() {
    if (this.onAutoSubmit) {
      console.log("Calling auto-submit callback immediately");
      try {
        this.onAutoSubmit();
      } catch (error) {
        console.error("Error calling auto-submit callback:", error);
      }
    } else {
      console.warn("No auto-submit callback set!");
    }

    Alert.alert(
      "Quiz Auto-Submitted",
      `You have exceeded the maximum number of warnings (${this.maxWarnings}). Your quiz has been automatically submitted due to suspicious activity.`,
      [
        {
          text: "OK",
          onPress: () => {
            console.log("User acknowledged auto-submit alert");
          },
        },
      ],
      { cancelable: false }
    );
  }

  getFocusEvents() {
    return this.focusEvents;
  }

  isSuspiciousBehavior() {
    if (!this.isMonitoring || this.focusEvents.length === 0) {
      return {
        isSuspicious: false,
        reason: "No monitoring data available",
        events: this.focusEvents,
      };
    }

    const backgroundEvents = this.focusEvents.filter(
      (event) => event.state === "background" || event.state === "inactive"
    );

    const suspiciousReasons = [];

    if (backgroundEvents.length >= this.suspiciousThreshold) {
      suspiciousReasons.push(
        `Excessive app switching (${backgroundEvents.length} times)`
      );
    }

    const longAwayPeriods = this.calculateAwayPeriods();
    if (longAwayPeriods.some((period) => period > this.maxSwitchTime)) {
      suspiciousReasons.push(
        `Extended time away from app (${Math.max(...longAwayPeriods)}ms)`
      );
    }

    if (this.hasRapidSwitchingPattern()) {
      suspiciousReasons.push("Rapid app switching pattern detected");
    }

    return {
      isSuspicious: suspiciousReasons.length > 0,
      reason:
        suspiciousReasons.length > 0
          ? suspiciousReasons.join("; ")
          : "Normal behavior",
      events: this.focusEvents,
      backgroundEvents: backgroundEvents.length,
      totalEvents: this.focusEvents.length,
      suspiciousReasons,
    };
  }

  calculateAwayPeriods() {
    const awayPeriods = [];
    let awayStart = null;

    for (let i = 0; i < this.focusEvents.length; i++) {
      const event = this.focusEvents[i];

      if (
        (event.state === "background" || event.state === "inactive") &&
        !awayStart
      ) {
        awayStart = event.timestamp;
      } else if (event.state === "active" && awayStart) {
        awayPeriods.push(event.timestamp - awayStart);
        awayStart = null;
      }
    }

    if (awayStart) {
      awayPeriods.push(Date.now() - awayStart);
    }

    return awayPeriods;
  }

  hasRapidSwitchingPattern() {
    if (this.focusEvents.length < 4) return false;

    const recentEvents = this.focusEvents.slice(-4);
    const timeSpan =
      recentEvents[recentEvents.length - 1].timestamp -
      recentEvents[0].timestamp;

    return timeSpan < 10000;
  }

  getQuestionIntegrityReport(questionId) {
    const questionEvents = this.focusEvents.filter(
      (event) => event.questionId === questionId
    );
    const backgroundEvents = questionEvents.filter(
      (event) => event.state === "background" || event.state === "inactive"
    );

    return {
      questionId,
      totalEvents: questionEvents.length,
      backgroundEvents: backgroundEvents.length,
      timeSpent:
        questionEvents.length > 0
          ? questionEvents[questionEvents.length - 1].timeFromStart -
            questionEvents[0].timeFromStart
          : 0,
      isSuspicious: backgroundEvents.length >= this.suspiciousThreshold,
    };
  }

  getMonitoringStats() {
    if (!this.isMonitoring) {
      return {
        isActive: false,
        message: "No active monitoring",
      };
    }

    const backgroundEvents = this.focusEvents.filter(
      (event) => event.state === "background" || event.state === "inactive"
    );

    return {
      isActive: true,
      currentQuestionId: this.currentQuestionId,
      totalEvents: this.focusEvents.length,
      backgroundEvents: backgroundEvents.length,
      monitoringDuration: this.startTime ? Date.now() - this.startTime : 0,
      suspiciousBehavior: this.isSuspiciousBehavior(),
    };
  }

  setBlockingEnabled(enabled) {
    this.blockingEnabled = enabled;
    console.log(`App switching blocking: ${enabled ? "enabled" : "disabled"}`);
  }

  setWarningEnabled(enabled) {
    this.warningEnabled = enabled;
    console.log(`Warning notifications: ${enabled ? "enabled" : "disabled"}`);
  }

  setAutoSubmitEnabled(enabled) {
    this.autoSubmitEnabled = enabled;
    console.log(`Auto-submit: ${enabled ? "enabled" : "disabled"}`);
  }

  setMaxWarnings(maxWarnings) {
    this.maxWarnings = maxWarnings;
    console.log(`Max warnings set to: ${maxWarnings}`);
  }

  setSuspiciousThreshold(threshold) {
    this.suspiciousThreshold = threshold;
    console.log(`Suspicious threshold set to: ${threshold}`);
  }

  setAutoSubmitCallback(callback) {
    this.onAutoSubmit = callback;
    console.log(`Auto-submit callback set: ${!!callback}`);
  }

  getWarningCount() {
    return this.warningCount;
  }

  isAutoSubmitPending() {
    return this.pendingAutoSubmit;
  }

  resetWarnings() {
    this.warningCount = 0;
    this.pendingAutoSubmit = false;
    console.log("Warning count reset");
  }

  cleanup() {
    this.stopMonitoring();
    this.focusEvents = [];
    this.suspiciousThreshold = 2;
    this.maxSwitchTime = 3000;
    this.warningCount = 0;
    this.onAutoSubmit = null;
  }

  reset() {
    this.focusEvents = [];
    this.currentQuestionId = null;
    this.startTime = null;
    this.warningCount = 0;
    this.pendingAutoSubmit = false;
  }

  forceAutoSubmit() {
    console.log("Force auto-submit called");
    if (this.onAutoSubmit) {
      try {
        this.onAutoSubmit();
      } catch (error) {
        console.error("Error in force auto-submit:", error);
      }
    } else {
      console.warn("No auto-submit callback available for force submit");
    }
  }
}

const appFocusService = new AppFocusService();
export default appFocusService;
