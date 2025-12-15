import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import * as Notifications from "expo-notifications";
import * as ExpoSplashScreen from "expo-splash-screen";

import SplashScreen from "./src/screen/splashScreen";
import LoginScreen from "./src/screen/loginScreen";
import TeacherDashboard from "./src/screen/teacherDashboard";
import StudentDashboard from "./src/screen/studentDashboard";
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
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="Voting" component={VotingScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Keep the native splash screen visible while we load
ExpoSplashScreen.preventAutoHideAsync();

export default function App() {
  const [notification, setNotification] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    let notificationListener;

    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        await registerForPushNotificationsAsync();

        // Set up notification listener
        notificationListener = Notifications.addNotificationReceivedListener(
          (notification) => {
            setNotification(notification);
          }
        );

        // Mark app as ready
        setAppIsReady(true);
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide the native splash screen - your SplashScreen.js component will show
        await ExpoSplashScreen.hideAsync();
      }
    }

    prepare();

    return () => {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
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
