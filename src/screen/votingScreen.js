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

function VotingScreen({ navigation }) {
  const {
    activeSession,
    userLocation,
    isInRange,
    canSubmit,
    submitVote,
    isSessionExpired,
    isSessionActive,
  } = useEnhancedSession();
  const { user } = useAuth();

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
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
        !hasVoted &&
        activeSession &&
        !hasShownTimeoutAlert
      ) {
        setHasShownTimeoutAlert(true);
        Alert.alert(
          "Session Ended",
          "The voting session has ended. You did not submit your vote, so your vote will not be counted.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hasVoted, activeSession, hasShownTimeoutAlert]);

  useEffect(() => {
    if (!isSessionActive && activeSession === null && !hasVoted) {
      Alert.alert(
        "Session Ended",
        "The teacher has ended the voting session. You did not submit your vote, so your vote will not be counted.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  }, [isSessionActive, activeSession, hasVoted]);

  function handleOptionSelect (optionIndex) {
    if (!activeSession) return;

    if (activeSession.allowMultipleChoice) {
      setSelectedOptions((prev) =>
        prev.includes(optionIndex)
          ? prev.filter((i) => i !== optionIndex)
          : [...prev, optionIndex]
      );
    } else {
      setSelectedOptions([optionIndex]);
    }
  };

  async function handleSubmitVote() {
    if (!canSubmit()) {
      Alert.alert(
        "Cannot Submit Vote",
        isSessionExpired()
          ? "Session time has expired"
          : "You must be within the required range to vote"
      );
      return;
    }

    if (selectedOptions.length === 0) {
      Alert.alert("Error", "Please select at least one option");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitVote(
        activeSession.id,
        {
          studentId: user?.id,
          studentName: user?.name,
          universityId: user?.universityId,
        },
        selectedOptions
      );

      if (result.success) {
        setHasVoted(true);
        Alert.alert(
          "Vote Submitted",
          "Your vote has been successfully recorded!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to submit vote");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!activeSession) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voting</Text>
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
          <Text style={styles.title}>Vote</Text>
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

          <View style={styles.questionCard}>
            <Text style={styles.questionTitle}>Question</Text>
            <Text style={styles.questionText}>{activeSession.question}</Text>

            {activeSession.allowMultipleChoice && (
              <Text style={styles.multipleChoiceNote}>
                You can select multiple options
              </Text>
            )}
          </View>

          <View style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>Options</Text>

            {activeSession.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedOptions.includes(index) &&
                    styles.optionButtonSelected,
                ]}
                onPress={() => handleOptionSelect(index)}
                disabled={hasVoted}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.optionIndicator,
                      selectedOptions.includes(index) &&
                        styles.optionIndicatorSelected,
                    ]}
                  >
                    {selectedOptions.includes(index) && (
                      <Text style={styles.optionCheckmark}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      selectedOptions.includes(index) &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

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

            {userLocation && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Distance to Session:</Text>
                <Text style={styles.locationText}>
                  {getDistanceToSession(activeSession,userLocation)?.toFixed(1)}m /{" "}
                  {activeSession.location.radius}m
                </Text>
              </View>
            )}
          </View>

          {hasVoted ? (
            <View style={styles.submittedCard}>
              <Text style={styles.submittedIcon}>📝</Text>
              <Text style={styles.submittedTitle}>Vote Submitted!</Text>
              <Text style={styles.submittedText}>
                Your vote has been successfully recorded.
              </Text>
              <Text style={styles.submittedDetails}>
                Selected:{" "}
                {selectedOptions
                  .map((i) => activeSession.options[i])
                  .join(", ")}
              </Text>
            </View>
          ) : (
            <View style={styles.actionCard}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!canSubmit() ||
                    isSubmitting ||
                    selectedOptions.length === 0) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitVote}
                disabled={
                  !canSubmit() || isSubmitting || selectedOptions.length === 0
                }
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      (!canSubmit() ||
                        isSubmitting ||
                        selectedOptions.length === 0) &&
                        styles.submitButtonTextDisabled,
                    ]}
                  >
                    {isSessionExpired()
                      ? "Session Expired"
                      : !isInRange
                      ? "Move Closer to Vote"
                      : selectedOptions.length === 0
                      ? "Select an Option"
                      : "Submit Vote"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Voting Instructions</Text>
            <Text style={styles.helpText}>
              •{" "}
              {activeSession.allowMultipleChoice
                ? "You can select multiple options"
                : "Select one option only"}
              {"\n"}• You must be within {activeSession.location.radius}m of the
              teacher{"\n"}• Submit your vote before time expires{"\n"}• Your
              vote cannot be changed once submitted
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default VotingScreen;

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
  questionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  questionText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  multipleChoiceNote: {
    fontSize: 14,
    color: "#007AFF",
    fontStyle: "italic",
    marginTop: 10,
  },
  optionsCard: {
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
  optionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  optionButton: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
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
    marginBottom: 10,
  },
  submittedDetails: {
    fontSize: 14,
    color: "#007AFF",
    textAlign: "center",
    fontStyle: "italic",
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
