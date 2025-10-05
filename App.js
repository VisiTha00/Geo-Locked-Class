import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import * as Notifications from "expo-notifications";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import TeacherDashboard from "./src/screens/TeacherDashboard";
import StudentDashboard from "./src/screens/StudentDashboard";
import SessionScreen from "./src/screens/SessionScreen";
import SessionCreationScreen from "./src/screens/SessionCreationScreen";
import AttendanceScreen from "./src/screens/AttendanceScreen";
import VotingScreen from "./src/screens/VotingScreen";
import QuizScreen from "./src/screens/QuizScreen";
import ReportingScreen from "./src/screens/ReportingScreen";
import QuizSettingsScreen from "./src/screens/QuizSettingsScreen";
import SessionEditScreen from "./src/screens/SessionEditScreen";
import UserManagementScreen from "./src/screens/UserManagementScreen";

// Import context
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SessionProvider } from "./src/context/SessionContext";
import { EnhancedSessionProvider } from "./src/context/EnhancedSessionContext";

const Stack = createStackNavigator();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppNavigator() {
  const { user, isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : user.role === "teacher" ? (
          <>
            <Stack.Screen
              name="TeacherDashboard"
              component={TeacherDashboard}
            />
            <Stack.Screen name="SessionScreen" component={SessionScreen} />
            <Stack.Screen
              name="SessionCreation"
              component={SessionCreationScreen}
            />
            <Stack.Screen name="Reporting" component={ReportingScreen} />
            <Stack.Screen name="QuizSettings" component={QuizSettingsScreen} />
            <Stack.Screen name="SessionEdit" component={SessionEditScreen} />
            <Stack.Screen
              name="UserManagement"
              component={UserManagementScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="StudentDashboard"
              component={StudentDashboard}
            />
            <Stack.Screen name="SessionScreen" component={SessionScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="Voting" component={VotingScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen
              name="NotificationScreen"
              component={NotificationScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [notification, setNotification] = useState(false);

  useEffect(() => {
    // Request notification permissions
    registerForPushNotificationsAsync();

    // Listen for notifications
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
    };
  }, []);

  return (
    <AuthProvider>
      <EnhancedSessionProvider>
        <View style={styles.container}>
          <StatusBar style="auto" />
          <AppNavigator />
        </View>
      </EnhancedSessionProvider>
    </AuthProvider>
  );
}

async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
