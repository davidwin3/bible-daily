import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, autoRegisterFCMToken } from "@/lib/firebase";
import { authAPI } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  realName: string;
  profileImage?: string;
  role: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  pendingRegistration: { firebaseToken: string } | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  completeRegistration: (data: {
    realName: string;
    firebaseToken: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRegistration, setPendingRegistration] = useState<{
    firebaseToken: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get Firebase token
          const token = await firebaseUser.getIdToken();

          // Login with backend
          const response = await authAPI.login(token);

          if (response.data.needsRegistration) {
            // 회원가입이 필요한 경우
            setPendingRegistration({ firebaseToken: token });
            setUser(null);
            return;
          }

          // Store token and user info
          localStorage.setItem("authToken", response.data.accessToken);
          setUser(response.data.user);
          setPendingRegistration(null);

          // 로그인 성공 후 FCM 토큰 자동 등록 시도
          // 약간의 지연을 두어 로그인 프로세스가 완료된 후 실행
          setTimeout(async () => {
            try {
              const fcmResult = await autoRegisterFCMToken();
              if (fcmResult.success) {
                console.log("FCM token auto-registered successfully");
              } else {
                console.log(
                  "FCM token auto-registration skipped or failed:",
                  fcmResult.error
                );
              }
            } catch (error) {
              console.error("FCM token auto-registration error:", error);
            }
          }, 1000); // 1초 후 실행
        } catch (error) {
          console.error("Login failed:", error);
          await signOut(auth);
          setUser(null);
          setPendingRegistration(null);
        }
      } else {
        localStorage.removeItem("authToken");
        setUser(null);
        setPendingRegistration(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      setUser(null);
      setFirebaseUser(null);
      setPendingRegistration(null);
      setLoading(false);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const completeRegistration = async (data: {
    realName: string;
    firebaseToken: string;
  }) => {
    try {
      const response = await authAPI.completeRegistration(data);

      // Store token and user info
      localStorage.setItem("authToken", response.data.accessToken);
      setUser(response.data.user);
      setPendingRegistration(null);
      setLoading(false);

      // FCM 토큰 자동 등록
      setTimeout(async () => {
        try {
          const fcmResult = await autoRegisterFCMToken();
          if (fcmResult.success) {
            console.log("FCM token auto-registered successfully");
          }
        } catch (error) {
          console.error("FCM token auto-registration error:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Registration completion failed:", error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    pendingRegistration,
    login,
    logout,
    completeRegistration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
