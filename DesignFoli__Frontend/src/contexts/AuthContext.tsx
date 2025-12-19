"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthState, AuthAction, AuthContextType, User } from "../../types/auth";

// Extended UserCredential interface to include additionalUserInfo
interface ExtendedUserCredential extends UserCredential {
  additionalUserInfo?: {
    isNewUser?: boolean;
    providerId?: string;
    profile?: Record<string, unknown>;
  };
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload, error: null };
    case "SET_TOKEN":
      return { ...state, token: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Convert Firebase user to our User type
  const firebaseUserToUser = (firebaseUser: FirebaseUser): User => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
  });

  // Get ID token
  const getToken = async (user: FirebaseUser): Promise<string> => {
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      throw new Error("Failed to get authentication token");
    }
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = firebaseUserToUser(userCredential.user);
      const token = await getToken(userCredential.user);

      dispatch({ type: "SET_USER", payload: user });
      dispatch({ type: "SET_TOKEN", payload: token });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      dispatch({
        type: "SET_ERROR",
        payload: errorMessage,
      });
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<{ isNewUser: boolean }> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log("UserCredential from Google sign-in:", userCredential);
      const user = firebaseUserToUser(userCredential.user);
      console.log("Firebase user converted to app user:", user);
      const token = await getToken(userCredential.user);
      console.log("Retrieved token:", token);


      localStorage.setItem(
        "googleUser",
        JSON.stringify({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          accessToken: token,
        })
      );
      console.log("User Details stored in localStorage", localStorage.getItem("googleUser"));

      // Check if this is a new user
      const isNewUser =
        (userCredential as ExtendedUserCredential).additionalUserInfo
          ?.isNewUser || false;

      dispatch({ type: "SET_USER", payload: user });
      dispatch({ type: "SET_TOKEN", payload: token });
      dispatch({ type: "SET_LOADING", payload: false });

      return { isNewUser };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Google login failed. Please try again.";
      dispatch({
        type: "SET_ERROR",
        payload: errorMessage,
      });
      throw error; // Re-throw to handle in calling component
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await signOut(auth);
      dispatch({ type: "LOGOUT" });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Logout failed. Please try again.";
      dispatch({
        type: "SET_ERROR",
        payload: errorMessage,
      });
    }
  };

  // Refresh token
  const refreshToken = async (): Promise<void> => {
    if (!state.user) return;

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await getToken(currentUser);
        dispatch({ type: "SET_TOKEN", payload: token });
      }
    } catch (error: unknown) {
      console.error("Token refresh failed:", error);
      // Don't set error state for token refresh failures to avoid disrupting user experience
    }
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Update user profile
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!state.user) {
      throw new Error("No user logged in");
    }

    try {
      // Update local state immediately for UI responsiveness
      const updatedUser = { ...state.user, ...updates };
      dispatch({ type: "SET_USER", payload: updatedUser });
      
      // Note: In a real implementation, you might also want to:
      // 1. Update Firebase user profile
      // 2. Sync with backend
      // For now, we'll just update the local state
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update profile";
      dispatch({
        type: "SET_ERROR",
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = firebaseUserToUser(firebaseUser);
        const token = await getToken(firebaseUser);

        dispatch({ type: "SET_USER", payload: user });
        dispatch({ type: "SET_TOKEN", payload: token });
        dispatch({ type: "SET_LOADING", payload: false });
      } else {
        dispatch({ type: "LOGOUT" });
      }
    });

    return () => unsubscribe();
  }, []);

  // Automatic token refresh (every 55 minutes)
  useEffect(() => {
    if (!state.user) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 55 * 60 * 1000); // 55 minutes

    return () => clearInterval(interval);
  }, [state.user]);

  const value: AuthContextType = {
    state,
    login,
    loginWithGoogle,
    logout,
    refreshToken,
    clearError,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
