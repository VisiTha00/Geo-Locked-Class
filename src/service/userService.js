import { firestore } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

class UserService {
  constructor() {
    this.collectionName = "users";
  }

  async getUserByEmail(email) {
    try {
      console.log("Looking up user by email:", email);
      const usersRef = collection(firestore, this.collectionName);
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No user found with email:", email);
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = {
        id: userDoc.id,
        ...userDoc.data(),
      };

      console.log("Found user:", userData);
      return userData;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const userRef = doc(firestore, this.collectionName, userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return {
          id: userSnap.id,
          ...userSnap.data(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const usersRef = collection(firestore, this.collectionName);
      const docRef = await addDoc(usersRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log("User created with ID:", docRef.id);
      return {
        id: docRef.id,
        ...userData,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const userRef = doc(firestore, this.collectionName, userId);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      console.log("User updated:", userId);
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const userRef = doc(firestore, this.collectionName, userId);
      await deleteDoc(userRef);
      console.log("User deleted:", userId);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const usersRef = collection(firestore, this.collectionName);
      const querySnapshot = await getDocs(usersRef);

      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  async getUsersByRole(role) {
    try {
      const usersRef = collection(firestore, this.collectionName);
      const q = query(usersRef, where("role", "==", role));
      const querySnapshot = await getDocs(q);

      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return users;
    } catch (error) {
      console.error("Error getting users by role:", error);
      throw error;
    }
  }

  async authenticateUser(email, password) {
    try {
      const user = await this.getUserByEmail(email);

      if (!user) {
        return { success: false, error: "Invalid email or password" };
      }

      if (user.password !== password) {
        return { success: false, error: "Invalid email or password" };
      }
      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error("Error authenticating user:", error);
      return { success: false, error: "Authentication failed" };
    }
  }
}

export default new UserService();
