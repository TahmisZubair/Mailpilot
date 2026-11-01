import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated,
  clearAuth,
  getUser,
  isTokenExpired,
  getAuthToken,
} from "../utils/auth";

export const useAuth = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = () => {
    const token = getAuthToken();

    if (token && isTokenExpired(token)) {
      clearAuth();
      setIsAuth(false);
      setUser(null);
      router.push("/login");
      return;
    }

    const authStatus = isAuthenticated();
    setIsAuth(authStatus);
    setUser(authStatus ? getUser() : null);
    setLoading(false);
  };

  const logout = () => {
    clearAuth();
    setIsAuth(false);
    setUser(null);
    router.push("/");

    window.location.href = "/";
  };

  useEffect(() => {
    checkAuth();

    const interval = setInterval(() => {
      const token = getAuthToken();
      if (token && isTokenExpired(token)) {
        logout();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    isAuth,
    user,
    loading,
    logout,
    checkAuth,
  };
};
