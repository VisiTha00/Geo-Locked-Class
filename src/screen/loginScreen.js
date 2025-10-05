import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const NotificationScreen = ({ navigation }) => {
  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleCheckLocation = () => {
    // This would trigger a location check in the student dashboard
    navigation.navigate("StudentDashboard");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session Notification</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.notificationCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📢</Text>
          </View>
          <Text style={styles.notificationTitle}>Session Started!</Text>
          <Text style={styles.notificationMessage}>
            A class session has started, but you are currently outside the
            required range to join.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What does this mean?</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoText}>
              • You need to be within 20 meters of the teacher's location to
              join the session
            </Text>
            <Text style={styles.infoText}>
              • Move closer to the teacher's location and check your position
            </Text>
            <Text style={styles.infoText}>
              • Your location is checked automatically when you're near the
              session
            </Text>
            <Text style={styles.infoText}>
              • You'll be able to join once you're in range
            </Text>
          </View>
        </View>

        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.checkLocationButton}
            onPress={handleCheckLocation}
          >
            <Text style={styles.checkLocationButtonText}>
              Check My Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.goBackButton} onPress={handleGoBack}>
            <Text style={styles.goBackButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            If you're having trouble getting in range:
          </Text>
          <View style={styles.helpList}>
            <Text style={styles.helpItem}>
              • Make sure location services are enabled
            </Text>
            <Text style={styles.helpItem}>
              • Check if you have a clear view of the sky for GPS
            </Text>
            <Text style={styles.helpItem}>
              • Try moving to a different location
            </Text>
            <Text style={styles.helpItem}>
              • Contact your teacher if the issue persists
            </Text>
          </View>
        </View>
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
    backgroundColor: "#FF9800",
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
  notificationCard: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 15,
  },
  icon: {
    fontSize: 48,
  },
  notificationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  notificationMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  infoCard: {
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
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  infoList: {
    gap: 10,
  },
  infoText: {
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
  checkLocationButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  checkLocationButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  goBackButton: {
    backgroundColor: "#6C757D",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  goBackButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  helpCard: {
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
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },
  helpList: {
    gap: 8,
  },
  helpItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default NotificationScreen;
