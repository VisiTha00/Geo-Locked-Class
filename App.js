import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import * as Notifications from "expo-notifications";

import SplashScreen from "./src/screen/splashScreen";
import LoginScreen from "./src/screen/loginScreen";
import TeacherDashboard from "./src/screen/teacherDashboard";
import StudentDashboard from "./src/screen/studentDashboard";
import SessionScreen from "./src/screen/sessionScreen";
import SessionCreationScreen from "./src/screen/sessionCreationScreen";
import AttendanceScreen from "./src/screen/attendanceScreen";
import VotingScreen from "./src/screen/votingScreen";
import QuizScreen from "./src/screen/quizScreen";
import ReportingScreen from "./src/screen/reportingScreen";
import SessionEditScreen from "./src/screen/sessionEditScreen";
import UserManagementScreen from "./src/screen/userManagementScreen";

import { AuthProvider, useAuth } from "./src/context/authContext";
import { SessionProvider } from "./src/context/sessionContext";

const Stack = createStackNavigator();

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
      <SessionProvider>
        <View style={styles.container}>
          <StatusBar style="auto" />
          <AppNavigator />
        </View>
      </SessionProvider>
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
