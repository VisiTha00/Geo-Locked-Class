import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import UserService from "../service/userService";
import { useAuth } from "../context/authContext";

const UserManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [role, setRole] = useState("student");

  useEffect(() => {
    if (user?.email !== process.env.EXPO_PUBLIC_ADMIN_EMAIL) {
      Alert.alert(
        "Access Denied",
        "Only the system administrator can access user management.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersList = await UserService.getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!name || !email || !password || !universityId) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsAdding(true);

      const existingUser = await UserService.getUserByEmail(email);
      if (existingUser) {
        Alert.alert("Error", "User with this email already exists");
        return;
      }

      const userData = {
        name,
        email,
        password,
        universityId,
        role,
      };

      await UserService.createUser(userData);

      setName("");
      setEmail("");
      setPassword("");
      setUniversityId("");
      setRole("student");

      await loadUsers();

      Alert.alert("Success", "User created successfully");
    } catch (error) {
      console.error("Error adding user:", error);
      Alert.alert("Error", "Failed to create user");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    Alert.alert("Delete User", `Are you sure you want to delete ${userName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await UserService.deleteUser(userId);
            await loadUsers();
            Alert.alert("Success", "User deleted successfully");
          } catch (error) {
            console.error("Error deleting user:", error);
            Alert.alert("Error", "Failed to delete user");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading users...</Text>
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
          <Text style={styles.title}>User Management</Text>
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
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add New User</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="University ID"
            placeholderTextColor="#999"
            value={universityId}
            onChangeText={setUniversityId}
            autoCapitalize="characters"
          />

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "teacher" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("teacher")}
            >
              <Text
                style={[
                  styles.roleText,
                  role === "teacher" && styles.roleTextActive,
                ]}
              >
                Teacher
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "student" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("student")}
            >
              <Text
                style={[
                  styles.roleText,
                  role === "student" && styles.roleTextActive,
                ]}
              >
                Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "admin" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("admin")}
            >
              <Text
                style={[
                  styles.roleText,
                  role === "admin" && styles.roleTextActive,
                ]}
              >
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addButton, isAdding && styles.addButtonDisabled]}
            onPress={handleAddUser}
            disabled={isAdding}
          >
            <Text style={styles.addButtonText}>
              {isAdding ? "Adding..." : "Add User"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.usersList}>
          <Text style={styles.listTitle}>Existing Users ({users.length})</Text>

          {users.map((user) => (
            <View key={user.id} style={styles.userItem}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userUniversityId}>
                  ID: {user.universityId || "Not set"}
                </Text>
                <Text
                  style={[
                    styles.userRole,
                    {
                      color:
                        user.role === "teacher"
                          ? "#007AFF"
                          : user.role === "admin"
                            ? "#FF9500"
                            : "#34C759",
                    },
                  ]}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteUser(user.id, user.name)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}

          {users.length === 0 && (
            <Text style={styles.noUsersText}>No users found</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  form: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 5,
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  roleText: {
    fontSize: 16,
    color: "#666",
  },
  roleTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  usersList: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  userUniversityId: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    fontStyle: "italic",
  },
  userRole: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  noUsersText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
  },
});

export default UserManagementScreen;
