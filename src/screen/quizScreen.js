import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEnhancedSession } from "../context/EnhancedSessionContext";
import { useAuth } from "../context/AuthContext";
import { formatTime, getDistanceToSession } from "../helper/helperFunctions";

function QuizScreen({ navigation }) {
  const {
    activeSession,
    userLocation,
    isInRange,
    canSubmit,
    submitQuiz,
    isSessionExpired,
    startQuizMonitoring,
    stopQuizMonitoring,
    getQuizIntegrityReport,
    getQuizWarningCount,
    resetQuizWarnings,
  } = useEnhancedSession();
  const { user } = useAuth();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showIntegrityWarning, setShowIntegrityWarning] = useState(false);
  const [hasShownTimeoutAlert, setHasShownTimeoutAlert] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!activeSession || !activeSession.startedAt) {
        setTimeRemaining(0);
        return;
      }
      const now = Date.now();
      const startTime = new Date(activeSession.startedAt).getTime();
      const timeLimit = activeSession.timeLimit * 1000; 
      const endTime = startTime + timeLimit;
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      setTimeRemaining(remaining);

      if (
        remaining <= 0 &&
        !hasSubmitted &&
        activeSession &&
        !hasShownTimeoutAlert
      ) {
        setHasShownTimeoutAlert(true);
        handleSubmitQuiz();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hasSubmitted, activeSession, hasShownTimeoutAlert]);

  async function handleAutoSubmit() {
    if (hasSubmitted) {
      return;
    }
    await handleSubmitQuiz(true);
  };

  useEffect(() => {
    if (
      activeSession &&
      activeSession.type === "quiz" &&
      activeSession.questions &&
      activeSession.questions.length > 0
    ) {
      startQuizMonitoring("quiz_session", handleAutoSubmit);
      setQuestionStartTime(Date.now());
      resetQuizWarnings(); 
    }

    return () => {
      stopQuizMonitoring();
    };
  }, [activeSession]); 

  useEffect(() => {
    if (activeSession && activeSession.type === "quiz") {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    const integrityCheck = setInterval(() => {
      const integrityReport = getQuizIntegrityReport();
      if (integrityReport.isSuspicious && !showIntegrityWarning) {
        setShowIntegrityWarning(true);
        Alert.alert(
          "Integrity Warning",
          "Suspicious activity detected. Please stay focused on the quiz.",
          [{ text: "OK", onPress: () => setShowIntegrityWarning(false) }]
        );
      }
    }, 5000); 

    return () => clearInterval(integrityCheck);
  }, [showIntegrityWarning, hasSubmitted]);

  function handleAnswerSelect (questionId, answer) {
    const timeSpent = Date.now() - questionStartTime;
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: {
          answer,
          timeSpent,
          submittedAt: new Date().toISOString(),
        },
      };
      return newAnswers;
    });
  };

  function handleNextQuestion () {
    if (
      activeSession.questions &&
      currentQuestionIndex < activeSession.questions.length - 1
    ) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  function handlePreviousQuestion () {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  async function handleSubmitQuiz (isAutoSubmit = false){
    if (hasSubmitted) {
      return;
    }

    if (!canSubmit()) {
      Alert.alert(
        "Cannot Submit Quiz",
        isSessionExpired()
          ? "Session time has expired"
          : "You must be within the required range to submit the quiz"
      );
      return;
    }

    const unansweredQuestions = (activeSession.questions || []).filter((q) => {
      const hasAnswer = answers[q.id] && answers[q.id].answer;
      return !hasAnswer;
    });

    if (isAutoSubmit) {
      submitQuizAnswers();
      return;
    }

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        "Incomplete Quiz",
        `You have ${unansweredQuestions.length} unanswered questions. Are you sure you want to submit?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Submit Anyway", onPress: () => submitQuizAnswers() },
        ]
      );
      return;
    }

    submitQuizAnswers();
  };

  async function submitQuizAnswers() {
    setIsSubmitting(true);

    try {
      const answersArray = Object.entries(answers).map(
        ([questionId, answerData]) => ({
          questionId,
          ...answerData,
        })
      );
      const result = await submitQuiz(
        activeSession.id,
        {
          studentId: user?.id,
          studentName: user?.name,
          universityId: user?.universityId,
        },
        answersArray
      );

      if (result.success) {
        setHasSubmitted(true);
        stopQuizMonitoring();
        Alert.alert(
          "Quiz Submitted",
          `Your quiz has been submitted successfully!\n\nScore: ${
            result.submission.score
          }/${
            result.submission.totalMarks
          }\nPercentage: ${result.submission.percentage.toFixed(1)}%`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to submit quiz");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeSession) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quiz</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.noSessionText}>No active session</Text>
        </View>
      </View>
    );
  }

  if (
    !activeSession.questions ||
    !Array.isArray(activeSession.questions) ||
    activeSession.questions.length === 0
  ) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quiz</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.noSessionText}>
            No questions available for this quiz
          </Text>
          <Text style={styles.noSessionText}>
            Debug: Questions = {JSON.stringify(activeSession.questions)}
          </Text>
        </View>
      </View>
    );
  }

  const safeQuestionIndex = Math.max(
    0,
    Math.min(currentQuestionIndex, activeSession.questions.length - 1)
  );
  const currentQuestion = activeSession.questions[safeQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Quiz</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {getQuizWarningCount() > 0 && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Warning: {getQuizWarningCount()}/3 - Stay focused on the quiz!
            </Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>{activeSession.title}</Text>
            <Text style={styles.sessionDescription}>
              {activeSession.description}
            </Text>

            <View style={styles.sessionInfo}>
              <Text style={styles.infoLabel}>Teacher:</Text>
              <Text style={styles.infoValue}>{activeSession.teacherName}</Text>
            </View>

            <View style={styles.sessionInfo}>
              <Text style={styles.infoLabel}>Time Remaining:</Text>
              <Text
                style={[
                  styles.infoValue,
                  timeRemaining < 60 && styles.warningText,
                ]}
              >
                {formatTime(timeRemaining)}
              </Text>
            </View>
          </View>

          {showIntegrityWarning && (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>Focus Warning</Text>
              <Text style={styles.warningMessage}>
                Please stay focused on the quiz. Switching apps may result in
                penalties.
              </Text>
            </View>
          )}

          {!hasSubmitted && currentQuestion && (
            <View style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>
                  Question {safeQuestionIndex + 1} of{" "}
                  {activeSession.questions.length}
                </Text>
                <Text style={styles.questionMarks}>
                  {currentQuestion.marks} mark
                  {currentQuestion.marks !== 1 ? "s" : ""}
                </Text>
              </View>

              <Text style={styles.questionText}>
                {currentQuestion.question}
              </Text>

              <View style={styles.optionsContainer}>
                {currentQuestion?.options?.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      currentAnswer?.answer === option &&
                        styles.optionButtonSelected,
                    ]}
                    onPress={() => {handleAnswerSelect(currentQuestion.id, option)}}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionIndicator,
                          currentAnswer?.answer === option &&
                            styles.optionIndicatorSelected,
                        ]}
                      >
                        {currentAnswer?.answer === option && (
                          <Text style={styles.optionCheckmark}>✓</Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          currentAnswer?.answer === option &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!hasSubmitted && (
            <View style={styles.navigationCard}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  safeQuestionIndex === 0 && styles.navButtonDisabled,
                ]}
                onPress={handlePreviousQuestion}
                disabled={safeQuestionIndex === 0}
              >
                <Text
                  style={[
                    styles.navButtonText,
                    safeQuestionIndex === 0 && styles.navButtonTextDisabled,
                  ]}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navButton,
                  safeQuestionIndex === activeSession.questions.length - 1 &&
                    styles.navButtonDisabled,
                ]}
                onPress={handleNextQuestion}
                disabled={
                  safeQuestionIndex === activeSession.questions.length - 1
                }
              >
                <Text
                  style={[
                    styles.navButtonText,
                    safeQuestionIndex === activeSession.questions.length - 1 &&
                      styles.navButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Location Status</Text>

            <View style={styles.statusRow}>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isInRange ? "#4CAF50" : "#F44336" },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isInRange ? "In Range" : "Out of Range"}
                </Text>
              </View>
            </View>

            {userLocation && activeSession.location && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Distance to Session:</Text>
                <Text style={styles.locationText}>
                  {getDistanceToSession(activeSession,userLocation)?.toFixed(1)}m /{" "}
                  {activeSession.location.radius}m
                </Text>
              </View>
            )}
          </View>

          {hasSubmitted ? (
            <View style={styles.submittedCard}>
              <Text style={styles.submittedIcon}>📝</Text>
              <Text style={styles.submittedTitle}>Quiz Submitted!</Text>
              <Text style={styles.submittedText}>
                Your quiz has been successfully submitted.
              </Text>
            </View>
          ) : (
            <View style={styles.actionCard}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!canSubmit() || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitQuiz}
                disabled={!canSubmit() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      (!canSubmit() || isSubmitting) &&
                        styles.submitButtonTextDisabled,
                    ]}
                  >
                    {isSessionExpired()
                      ? "Session Expired"
                      : !isInRange
                      ? "Move Closer to Submit"
                      : "Submit Quiz"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default QuizScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  gradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 60,
  },
  scrollContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  noSessionText: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginTop: 50,
  },
  warningContainer: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginTop: 0,
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  sessionCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  sessionDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  sessionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  warningText: {
    color: "#F44336",
  },
  warningCard: {
    backgroundColor: "#FFF3CD",
    borderColor: "#FFEAA7",
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  warningText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 5,
  },
  warningMessage: {
    fontSize: 14,
    color: "#856404",
    flex: 1,
  },
  questionCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  questionMarks: {
    fontSize: 14,
    color: "#666",
  },
  questionText: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    backgroundColor: "white",
  },
  optionButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIndicatorSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  optionCheckmark: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  optionTextSelected: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  navigationCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: "#ccc",
  },
  navButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  navButtonTextDisabled: {
    color: "#999",
  },
  statusCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  statusRow: {
    marginBottom: 15,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: "#666",
  },
  locationInfo: {
    marginTop: 10,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  submittedCard: {
    backgroundColor: "#E8F5E8",
    padding: 30,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  submittedIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  submittedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10,
  },
  submittedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  actionCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  submitButtonTextDisabled: {
    color: "#999",
  },
  helpCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
