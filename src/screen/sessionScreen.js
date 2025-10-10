import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useEnhancedSession } from "../context/EnhancedSessionContext";

const SessionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const {
    activeSession,
    endSession,
    isSessionActive,
    getSessionTimeRemaining,
  } = useEnhancedSession();
  const [sessionTime, setSessionTime] = useState("00:00:00");

  useEffect(() => {
    let interval;
    if (isSessionActive && activeSession && activeSession.startedAt) {
      interval = setInterval(() => {
        // Calculate time remaining directly from session data
        const now = Date.now();
        const startTime = new Date(activeSession.startedAt).getTime();
        const timeLimit = activeSession.timeLimit * 1000; // Convert to milliseconds
        const endTime = startTime + timeLimit;
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000)); // Convert back to seconds

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        setSessionTime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }, 1000);
    } else {
      setSessionTime("00:00:00");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, activeSession]);

  const handleEndSession = () => {
    if (!user || user.role !== "teacher") {
      Alert.alert("Access Denied", "Only teachers can end sessions.");
      return;
    }

    Alert.alert("End Session", "Are you sure you want to end this session?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "End Session",
        style: "destructive",
        onPress: () => {
          endSession(activeSession.id);
          navigation.goBack();
          Alert.alert("Session Ended", "The class session has been ended.");
        },
      },
    ]);
  };

  const handleLeaveSession = () => {
    Alert.alert(
      "Leave Session",
      "Are you sure you want to leave this session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (!isSessionActive || !activeSession) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>No Active Session</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.noSessionText}>
            There is no active session at the moment.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Session</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.sessionInfoCard}>
          <Text style={styles.sessionTitle}>Session Information</Text>
          <View style={styles.sessionDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Session ID:</Text>
              <Text style={styles.detailValue}>{activeSession.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>
                {activeSession.type
                  ? activeSession.type.charAt(0).toUpperCase() +
                    activeSession.type.slice(1)
                  : "Unknown"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Title:</Text>
              <Text style={styles.detailValue}>
                {activeSession.title || "Untitled Session"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Started:</Text>
              <Text style={styles.detailValue}>
                {activeSession.startedAt
                  ? new Date(activeSession.startedAt).toLocaleString()
                  : "Unknown"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{sessionTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, styles.statusActive]}>
                {activeSession.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>Session Location</Text>
          <View style={styles.locationDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Latitude:</Text>
              <Text style={styles.detailValue}>
                {activeSession.location.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Longitude:</Text>
              <Text style={styles.detailValue}>
                {activeSession.location.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Range:</Text>
              <Text style={styles.detailValue}>
                {activeSession.location.radius}m radius
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.roleCard}>
          <Text style={styles.roleTitle}>Your Role</Text>
          <View style={styles.roleInfo}>
            <Text style={styles.roleText}>
              {user && user.role === "teacher" ? "Teacher" : "Student"}
            </Text>
            <Text style={styles.roleDescription}>
              {user && user.role === "teacher"
                ? "You are the session host and can end the session at any time."
                : "You are participating in this session. Make sure you stay within the required range."}
            </Text>
          </View>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionText}>
              •{" "}
              {user && user.role === "teacher"
                ? "You can end this session at any time using the button below."
                : "Stay within 20m of the session location to remain connected."}
            </Text>
            <Text style={styles.instructionText}>
              •{" "}
              {user && user.role === "teacher"
                ? "Students will receive notifications when you start a session."
                : "You will be notified if you move outside the required range."}
            </Text>
            <Text style={styles.instructionText}>
              •{" "}
              {user && user.role === "teacher"
                ? "Monitor the session duration and location accuracy."
                : "Your location is checked automatically every few seconds."}
            </Text>
          </View>
        </View>

        <View style={styles.actionCard}>
          {user && user.role === "teacher" ? (
            <TouchableOpacity
              style={styles.endSessionButton}
              onPress={handleEndSession}
            >
              <Text style={styles.endSessionButtonText}>End Session</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.leaveSessionButton}
              onPress={handleLeaveSession}
            >
              <Text style={styles.leaveSessionButtonText}>Leave Session</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default SessionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#007AFF",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  sessionInfoCard: {
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  sessionDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  statusActive: {
    color: "#4CAF50",
  },
  locationCard: {
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
  locationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  locationDetails: {
    gap: 10,
  },
  roleCard: {
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
  roleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  roleInfo: {
    gap: 10,
  },
  roleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  roleDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  instructionsCard: {
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
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  instructionsList: {
    gap: 10,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  endSessionButton: {
    backgroundColor: "#F44336",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  endSessionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  leaveSessionButton: {
    backgroundColor: "#FF9800",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  leaveSessionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
