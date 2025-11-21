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
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useAuth } from "../context/authContext";
import { useSession } from "../context/sessionContext";
import { getDistanceToSession } from "../helper/helperFunctions";

function StudentDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const {
    activeSession,
    isSessionActive,
    isInRange,
    userLocation,
    canSubmit,
    forceRangeCheck,
    isSubmitted,
    isSessionExpired,
  } = useSession();
  const [loading, setLoading] = useState(false);
  const [setLocationPermission] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [notificationSent, setNotificationSent] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    const cleanup = setupNotificationListener();
    return cleanup;
  }, []);

  useEffect(() => {
    if (isSessionActive && userLocation && !notificationSent) {
      setLastChecked(new Date());
      sendStudentNotification();
      setNotificationSent(true);
    } else if (!isSessionActive) {
      setNotificationSent(false);
    }
  }, [isSessionActive, userLocation, notificationSent]);

  async function sendStudentNotification() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎓 Class Session Started!",
          body: "A new class session has started. Check if you're in range to join.",
          data: { sessionId: activeSession?.id, type: "session_started" },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending student notification:", error);
    }
  }

  async function requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to join sessions."
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
      setLastChecked(new Date());

      if (activeSession && location.coords) {
        console.log("Manual location check triggered");
        forceRangeCheck();
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoading(false);
    }
  }

  function setupNotificationListener() {
    try {
      const subscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          if (notification.request.content.data?.type === "session_started") {
            Alert.alert(
              "Session Started!",
              "A class session has started. Check if you're in range to join.",
              [
                {
                  text: "Check Location",
                  onPress: () => {
                    getCurrentLocation();
                  },
                },
                { text: "OK" },
              ]
            );
          }
        }
      );

      return () => {
        try {
          subscription.remove();
        } catch (error) {
          console.log("Error removing notification subscription:", error);
        }
      };
    } catch (error) {
      console.log("Error setting up notification listener:", error);
      return () => {};
    }
  }

  function handleJoinSession() {
    if (isSubmitted()) {
      Alert.alert(
        "Already Submitted",
        "You have already submitted your response for this session."
      );
      return;
    }

    if (isSessionExpired()) {
      Alert.alert(
        "Session Expired",
        "The session time limit has exceeded. You can no longer join this session."
      );
      return;
    }

    if (!canSubmit()) {
      Alert.alert(
        "Cannot Join Session",
        "You are not within the required range. Please move closer to the teacher's location."
      );
      return;
    }

    switch (activeSession.type) {
      case "attendance":
        navigation.navigate("Attendance");
        break;
      case "voting":
        navigation.navigate("Voting");
        break;
      case "quiz":
        navigation.navigate("Quiz");
        break;
      default:
        navigation.navigate("SessionScreen");
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
            <Text style={styles.title}>Student Dashboard</Text>
            <Text style={styles.welcomeText}>
              Welcome, {user?.name || "Student"}!
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
              {isSessionActive ? "Session Available" : "No Active Session"}
            </Text>
          </View>
        </View>

        {isSessionActive && (
          <View style={styles.rangeCard}>
            <Text style={styles.rangeTitle}>Location Status</Text>
            <View style={styles.rangeIndicator}>
              <View
                style={[
                  styles.rangeDot,
                  { backgroundColor: isInRange ? "#4CAF50" : "#F44336" },
                ]}
              />
              <Text style={styles.rangeText}>
                {isInRange ? "In Range" : "Out of Range"}
              </Text>
            </View>

            {activeSession && userLocation && (
              <View style={styles.distanceInfo}>
                <Text style={styles.distanceText}>
                  Distance to session:{" "}
                  {getDistanceToSession(activeSession, userLocation)?.toFixed(
                    1
                  )}
                  m
                </Text>
                <Text style={styles.radiusText}>
                  Required range: {activeSession.location.radius}m
                </Text>
                {lastChecked && (
                  <Text style={styles.lastCheckedText}>
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.checkButton}
              onPress={() => {
                getCurrentLocation();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.checkButtonText}>Check Location</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>Your Location</Text>
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
        </View>

        {isSessionActive && (
          <View style={styles.actionCard}>
            <TouchableOpacity
              style={[
                styles.joinButton,
                !canSubmit() && styles.joinButtonDisabled,
              ]}
              onPress={handleJoinSession}
              disabled={!canSubmit() || isSubmitted() || isSessionExpired()}
            >
              <Text
                style={[
                  styles.joinButtonText,
                  (!canSubmit() || isSubmitted() || isSessionExpired()) &&
                    styles.joinButtonTextDisabled,
                ]}
              >
                {isSubmitted()
                  ? "Already Submitted"
                  : isSessionExpired()
                  ? "Session Timed Out"
                  : canSubmit()
                  ? `Join ${
                      activeSession.type.charAt(0).toUpperCase() +
                      activeSession.type.slice(1)
                    } Session`
                  : "Move Closer to Join"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            • You'll receive notifications when sessions start
          </Text>
          <Text style={styles.infoText}>
            • You must be within a required range of the teacher to join
          </Text>
          <Text style={styles.infoText}>
            • Your location is checked automatically
          </Text>
          <Text style={styles.infoText}>
            • Tap "Check Location" to refresh your position
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default StudentDashboard;

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
  rangeCard: {
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
  rangeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  rangeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  rangeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  rangeText: {
    fontSize: 16,
    color: "#666",
  },
  distanceInfo: {
    marginBottom: 15,
  },
  distanceText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  radiusText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  lastCheckedText: {
    fontSize: 12,
    color: "#999",
  },
  checkButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  checkButtonText: {
    color: "white",
    fontWeight: "bold",
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
  joinButton: {
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
  joinButtonDisabled: {
    backgroundColor: "#ccc",
  },
  joinButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  joinButtonTextDisabled: {
    color: "#999",
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
});
