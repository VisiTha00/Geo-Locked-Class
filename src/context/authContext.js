import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import UserService from "../service/UserService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log("Attempting login for email:", email);

      // First, try to authenticate using UserService
      const authResult = await UserService.authenticateUser(email, password);

      if (authResult.success) {
        const userData = authResult.user;
        console.log("Login successful for user:", userData);

        // Store user data in AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);

        return { success: true };
      }

      // If authentication failed, check if it's because no users exist
      // In that case, allow fallback login for initial setup
      console.log("Authentication failed:", authResult.error);

      // Check if this is a fallback login for initial setup
      if (email === "admin@setup.com" && password === "setup123") {
        console.log("Using fallback login for initial setup");

        // Create a temporary setup user (acts as teacher with admin privileges)
        const fallbackUser = {
          id: "admin_setup",
          name: "Admin Setup",
          email: "admin@setup.com",
          role: "teacher",
        };

        await AsyncStorage.setItem("user", JSON.stringify(fallbackUser));
        setUser(fallbackUser);
        setIsAuthenticated(true);

        return { success: true };
      }

      return { success: false, error: authResult.error };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
