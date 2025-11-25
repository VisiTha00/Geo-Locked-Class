import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useSession } from "../context/sessionContext";

const SessionEditScreen = ({ navigation, route }) => {
  const { activeSession, updateSession } = useSession();
  const { sessionId } = route.params || {};

  const [timeLimit, setTimeLimit] = useState(5);
  const [radius, setRadius] = useState(20);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (activeSession) {
      setTimeLimit(Math.floor(activeSession.timeLimit / 60)); 
      setRadius(activeSession.location?.radius || 20);
    }
  }, [activeSession]);

  const handleUpdateSession = async () => {
    if (!activeSession) {
      Alert.alert("Error", "No active session found");
      return;
    }

    const finalTimeLimit = timeLimit === "" ? 5 : timeLimit;
    const finalRadius = radius === "" ? 20 : radius;

    if (finalTimeLimit < 1 || finalTimeLimit > 120) {
      Alert.alert("Error", "Time limit must be between 1 and 120 minutes");
      return;
    }

    if (finalRadius < 5 || finalRadius > 1000) {
      Alert.alert("Error", "Radius must be between 5 and 1000 meters");
      return;
    }

    setIsUpdating(true);

    try {
      const updatedSession = {
        ...activeSession,
        timeLimit: finalTimeLimit * 60,
        location: {
          ...activeSession.location,
          radius: finalRadius,
        },
      };

      const result = await updateSession(updatedSession);

      if (result.success) {
        Alert.alert(
          "Session Updated",
          "Session settings have been updated successfully.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to update session");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while updating the session");
      console.error("Error updating session:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!activeSession) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Session</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.noSessionText}>No active session found</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Session</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{activeSession.title}</Text>
          <Text style={styles.sessionType}>
            {activeSession.type.charAt(0).toUpperCase() +
              activeSession.type.slice(1)}{" "}
            Session
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Settings</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Time Limit (minutes):</Text>
            <TextInput
              style={styles.numberInput}
              value={timeLimit.toString()}
              onChangeText={(value) => {
                if (value === "") {
                  setTimeLimit("");
                } else {
                  const num = parseInt(value);
                  if (!isNaN(num) && num > 0) {
                    setTimeLimit(num);
                  }
                }
              }}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Radius (meters):</Text>
            <TextInput
              style={styles.numberInput}
              value={radius.toString()}
              onChangeText={(value) => {
                if (value === "") {
                  setRadius("");
                } else {
                  const num = parseInt(value);
                  if (!isNaN(num) && num > 0) {
                    setRadius(num);
                  }
                }
              }}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>
              Status:{" "}
              {activeSession.status === "active" ? "Active" : "Inactive"}
            </Text>
            <Text style={styles.statusText}>
              Started: {new Date(activeSession.startedAt).toLocaleString()}
            </Text>
            <Text style={styles.statusText}>
              Location: {activeSession.location?.latitude?.toFixed(6)},{" "}
              {activeSession.location?.longitude?.toFixed(6)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.updateButton,
            isUpdating && styles.updateButtonDisabled,
          ]}
          onPress={handleUpdateSession}
          disabled={isUpdating}
        >
          <Text style={styles.updateButtonText}>
            {isUpdating ? "Updating..." : "Update Session"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#2196F3",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sessionInfo: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  sessionType: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    width: 80,
    textAlign: "center",
    fontSize: 16,
  },
  statusInfo: {
    marginTop: 10,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  updateButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  updateButtonDisabled: {
    backgroundColor: "#ccc",
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  noSessionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
  },
});

export default SessionEditScreen;
