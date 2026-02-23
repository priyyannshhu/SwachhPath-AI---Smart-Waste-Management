import usersData from "@/react-app/data/users.json";
import type { User } from "@/react-app/types";

/**
 * Mock authentication service using JSON-based user data.
 * No backend; uses localStorage for session management.
 */

let currentUser: User | null = null;

/**
 * Initialize current user from localStorage
 */
export function initializeAuthService(): void {
  const stored = localStorage.getItem("swachhpath_user");
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
    } catch {
      console.warn("Failed to parse stored user");
      currentUser = null;
    }
  }
}

/**
 * Sign up a new user (demo only - adds to local state)
 */
export async function signup(userData: {
  name: string;
  email: string;
  password: string;
  locality: string;
  phone: string;
}): Promise<{ success: boolean; message: string; user?: User }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Check if user already exists
      const existingUser = usersData.users.find((u) => u.email === userData.email);
      if (existingUser) {
        resolve({
          success: false,
          message: "Email already registered",
        });
        return;
      }

      // Create new user in memory (demo simulates backend creation)
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        password: userData.password, // Demo only; never store plain passwords in production
        role: "citizen",
        locality: userData.locality,
        phone: userData.phone,
        createdAt: new Date().toISOString(),
      };

      // In real app, this would be saved to backend
      // Here we save to localStorage to simulate persistence
      const allUsers = [...usersData.users, newUser];
      localStorage.setItem("swachhpath_all_users", JSON.stringify(allUsers));

      currentUser = newUser;
      localStorage.setItem("swachhpath_user", JSON.stringify(newUser));

      resolve({
        success: true,
        message: "Account created successfully",
        user: newUser,
      });
    }, 800);
  });
}

/**
 * Login user by email and password
 */
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // First check localStorage for users added via signup
      const storedUsers = localStorage.getItem("swachhpath_all_users");
      const allUsers = storedUsers ? JSON.parse(storedUsers) : usersData.users;

      const user = allUsers.find((u: User) => u.email === email && u.password === password);

      if (!user) {
        resolve({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      currentUser = user;
      localStorage.setItem("swachhpath_user", JSON.stringify(user));

      resolve({
        success: true,
        message: "Login successful",
        user,
      });
    }, 800);
  });
}

/**
 * Logout current user
 */
export function logout(): void {
  currentUser = null;
  localStorage.removeItem("swachhpath_user");
}

/**
 * Get currently logged-in user
 */
export function getCurrentUser(): User | null {
  return currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return currentUser !== null;
}

/**
 * Check if current user is admin
 */
export function isAdmin(): boolean {
  return currentUser?.role === "admin";
}

/**
 * Get user by ID (for reference lookups)
 */
export function getUserById(userId: string): User | undefined {
  const storedUsers = localStorage.getItem("swachhpath_all_users");
  const allUsers = storedUsers ? JSON.parse(storedUsers) : usersData.users;
  return allUsers.find((u: User) => u.id === userId);
}

/**
 * Get user name by ID (helper for display)
 */
export function getUserName(userId: string): string {
  const user = getUserById(userId);
  return user?.name || "Unknown User";
}
