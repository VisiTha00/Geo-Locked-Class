import React, { useState, useEffect, useRef } from "react";
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
import * as Location from "expo-location";
import { useAuth } from "../context/authContext";
import { useSession } from "../context/sessionContext";

function TeacherDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const { activeSession, isSessionActive, endSession, userLocation } =
    useSession();
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isSessionActive && activeSession) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const startTime = new Date(activeSession.startedAt).getTime();
        const timeLimit = activeSession.timeLimit * 1000;
        const endTime = startTime + timeLimit;
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);
      }, 1000);
    } else {
      setTimeRemaining(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSessionActive, activeSession]);

  async function requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to start sessions."
        );
        return;
      }
      setLocationPermission(true);
      getCurrentLocation();
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert("Error", "Failed to request location permission");
    }
  }

  async function getCurrentLocation() {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (activeSession && location.coords) {
        forceRangeCheck();
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoading(false);
    }
  }

  function handleCreateSession() {
    navigation.navigate("SessionCreation");
  }

  async function handleEndSession(showConfirmation = true) {
    if (showConfirmation) {
      Alert.alert(
        "End Session",
        "Are you sure you want to end the current session?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "End Session",
            style: "destructive",
            onPress: () => endSessionDirectly(),
          },
        ]
      );
    } else {
      await endSessionDirectly();
    }
  }

  async function endSessionDirectly() {
    try {
      const result = await endSession(activeSession.id);
      if (result.success) {
        Alert.alert("Session Ended", "The class session has been ended.");
      } else {
        Alert.alert("Error", result.error || "Failed to end session");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to end session");
    }
  }

  function handleLogout() {
    if (!user) {
      console.log("User is null, logging out directly");
      logout();
      return;
    }

    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: logout },
    ]);
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
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Teacher Dashboard</Text>
            <Text style={styles.welcomeText}>
              Welcome, {user?.name || "Teacher"}!
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Session Status</Text>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isSessionActive ? "#4CAF50" : "#F44336" },
              ]}
            />
            <Text style={styles.statusText}>
              {isSessionActive ? "Session Active" : "No Active Session"}
            </Text>
          </View>
          {isSessionActive && activeSession && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Time Remaining:</Text>
              <Text
                style={[
                  styles.timerText,
                  {
                    color:
                      timeRemaining <= 0
                        ? "#F44336"
                        : timeRemaining <= 60
                          ? "#FF9800"
                          : "#333",
                  },
                ]}
              >
                {timeRemaining <= 0
                  ? "Time Exceeded"
                  : `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60)
                      .toString()
                      .padStart(2, "0")}`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>Location Status</Text>
          {userLocation ? (
            <View>
              <Text style={styles.locationText}>
                Latitude: {userLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Longitude: {userLocation.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Accuracy: {userLocation.accuracy?.toFixed(1)}m
              </Text>
            </View>
          ) : (
            <Text style={styles.locationText}>Location not available</Text>
          )}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>Refresh Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionCard}>
          {isSessionActive ? (
            <View>
              <TouchableOpacity
                style={styles.endSessionButton}
                onPress={handleEndSession}
              >
                <Text style={styles.endSessionButtonText}>
                  {timeRemaining <= 0
                    ? "End Session (Time Exceeded)"
                    : "End Session"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() =>
                  navigation.navigate("Reporting", {
                    sessionId: activeSession.id,
                  })
                }
              >
                <Text style={styles.reportButtonText}>Generate Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("SessionEdit")}
              >
                <Text style={styles.editButtonText}>Edit Session</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.createSessionButton}
              onPress={handleCreateSession}
              disabled={loading || !userLocation}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createSessionButtonText}>
                  Create Session
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {user && user.email === process.env.EXPO_PUBLIC_ADMIN_EMAIL && (
          <View style={styles.actionCard}>
            <TouchableOpacity
              style={styles.userManagementButton}
              onPress={() => navigation.navigate("UserManagement")}
            >
              <Text style={styles.userManagementButtonText}>Manage Users</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Session Information</Text>
          <Text style={styles.infoText}>
            • Students within a certain radius can join the session
          </Text>
          <Text style={styles.infoText}>
            • Students outside the radius will receive notifications
          </Text>
          <Text style={styles.infoText}>
            • Location permission is required to start sessions
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default TeacherDashboard;

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
    alignItems: "flex-start",
    minHeight: 80,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  welcomeText: {
    fontSize: 16,
    color: "white",
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
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
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
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
  timerContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
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
    marginBottom: 10,
    color: "#333",
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  refreshButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  actionCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  createSessionButton: {
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
  createSessionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  endSessionButton: {
    backgroundColor: "#F44336",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  endSessionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  viewSessionButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  viewSessionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  reportButton: {
    backgroundColor: "#FF9800",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  reportButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  settingsButton: {
    backgroundColor: "#9C27B0",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  settingsButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#FF5722",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  editButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  userManagementButton: {
    backgroundColor: "#34C759",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  userManagementButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
