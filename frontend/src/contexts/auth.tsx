import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { 
  auth, 
  googleProvider, 
  signInWithGoogleRedirect, 
  handleRedirectResult,
  isMobileWebView,
  isSecureBrowser 
} from "@/lib/firebase";
import { authAPI } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  role: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  isWebView: boolean;
  isSecure: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
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
  const [error, setError] = useState<string | null>(null);
  const [isWebView] = useState(isMobileWebView());
  const [isSecure] = useState(isSecureBrowser());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setError(null);

      if (firebaseUser) {
        try {
          // Get Firebase token
          const token = await firebaseUser.getIdToken();

          // Login with backend
          const response = await authAPI.login(token);

          // Store token and user info
          localStorage.setItem("authToken", response.data.accessToken);
          setUser(response.data.user);
        } catch (error) {
          console.error("Login failed:", error);
          setError("로그인 처리 중 오류가 발생했습니다.");
          await signOut(auth);
          setUser(null);
        }
      } else {
        localStorage.removeItem("authToken");
        setUser(null);
      }

      setLoading(false);
    });

    // 리다이렉트 결과 처리 (페이지 로드 시)
    const checkRedirectResult = async () => {
      try {
        const result = await handleRedirectResult();
        if (result) {
          // 리다이렉트 로그인 성공 - onAuthStateChanged에서 처리됨
          console.log("Redirect login successful");
        }
      } catch (error) {
        console.error("Redirect result error:", error);
        setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
        setLoading(false);
      }
    };

    checkRedirectResult();

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      setError(null);

      // WebView나 보안이 취약한 환경에서는 리다이렉트 방식 사용
      if (isWebView || !isSecure) {
        await signInWithGoogleRedirect();
        // 리다이렉트 후 페이지가 새로고침되므로 여기서는 loading을 false로 설정하지 않음
        return;
      }

      // 일반 브라우저에서는 팝업 방식 사용
      try {
        await signInWithPopup(auth, googleProvider);
        // onAuthStateChanged will handle the rest
      } catch (popupError: any) {
        // 팝업이 차단되었거나 실패한 경우 리다이렉트 방식으로 대체
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          console.log("Popup blocked, falling back to redirect");
          await signInWithGoogleRedirect();
          return;
        }
        throw popupError;
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      setLoading(false);
      
      // 구체적인 에러 메시지 설정
      if (error.code === 'auth/popup-blocked') {
        setError("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("네트워크 연결을 확인해주세요.");
      } else if (error.message?.includes('보안 브라우저')) {
        setError("보안상의 이유로 로그인할 수 없습니다. 일반 브라우저에서 다시 시도해주세요.");
      } else {
        setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      setUser(null);
      setFirebaseUser(null);
      setError(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setError("로그아웃 중 오류가 발생했습니다.");
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    firebaseUser,
    loading,
    error,
    isWebView,
    isSecure,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
