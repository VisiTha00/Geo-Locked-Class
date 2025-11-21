import { useState, useEffect } from "react";
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
import { useSession } from "../context/sessionContext";
import { useAuth } from "../context/authContext";
import { formatTime, getDistanceToSession } from "../helper/helperFunctions";

function AttendanceScreen({ navigation }) {
  const {
    activeSession,
    userLocation,
    isInRange,
    canSubmit,
    submitAttendance,
    isSessionExpired,
    isSessionActive,
  } = useSession();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
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
        !hasSubmitted &&
        activeSession &&
        !hasShownTimeoutAlert
      ) {
        console.log(
          "Time limit exceeded - attendance session ended without submission"
        );
        setHasShownTimeoutAlert(true);
        Alert.alert(
          "Session Ended",
          "The attendance session has ended. You did not mark your attendance, so you will be recorded as absent.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hasSubmitted, activeSession, hasShownTimeoutAlert]);

  useEffect(() => {
    if (!isSessionActive && activeSession === null && !hasSubmitted) {
      Alert.alert(
        "Session Ended",
        "The teacher has ended the attendance session. You did not mark your attendance, so you will be recorded as absent.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  }, [isSessionActive, activeSession, hasSubmitted]);

  async function handleMarkAttendance() {
    if (!canSubmit()) {
      Alert.alert(
        "Cannot Mark Attendance",
        isSessionExpired()
          ? "Session time has expired"
          : "You must be within the required range to mark attendance"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitAttendance(activeSession.id, {
        studentId: user?.id,
        studentName: user?.name,
        universityId: user?.universityId,
      });

      if (result.success) {
        setHasSubmitted(true);
        Alert.alert(
          "Attendance Marked",
          "Your attendance has been successfully recorded!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to mark attendance");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to mark attendance");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!activeSession) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Attendance</Text>
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
          <Text style={styles.title}>Mark Attendance</Text>
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
                <Text style={styles.locationLabel}>Your Location:</Text>
                <Text style={styles.locationText}>
                  {userLocation.latitude.toFixed(6)},{" "}
                  {userLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Accuracy: {userLocation.accuracy?.toFixed(1)}m
                </Text>

                <Text style={styles.locationLabel}>Distance to Session:</Text>
                <Text style={styles.locationText}>
                  {getDistanceToSession(activeSession, userLocation)?.toFixed(
                    1
                  )}
                  m / {activeSession.location.radius}m
                </Text>
              </View>
            )}
          </View>

          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Requirements</Text>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>📍</Text>
              <Text style={styles.requirementText}>
                Be within {activeSession.location.radius}m of the teacher
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>⏰</Text>
              <Text style={styles.requirementText}>
                Mark attendance before time expires
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementIcon}>📱</Text>
              <Text style={styles.requirementText}>
                Keep location services enabled
              </Text>
            </View>
          </View>

          {hasSubmitted ? (
            <View style={styles.submittedCard}>
              <Text style={styles.submittedIcon}>✅</Text>
              <Text style={styles.submittedTitle}>Attendance Submitted!</Text>
              <Text style={styles.submittedText}>
                Your attendance has been successfully recorded.
              </Text>
            </View>
          ) : (
            <View style={styles.actionCard}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!canSubmit() || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleMarkAttendance}
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
                      ? "Move Closer to Mark Attendance"
                      : "Mark Attendance"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default AttendanceScreen;

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
    borderRadius: 16,
    marginBottom: 15,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
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
  requirementsCard: {
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
  requirementsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  requirementIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  requirementText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
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
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
