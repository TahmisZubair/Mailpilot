export interface User {
  id: string;
  userName: string;
  email: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const getUser = (): User | null => {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");

    if (email && userName) {
      return {
        id: "",
        userName,
        email,
        createdAt: "",
      };
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = getUser();

  if (!token || !user) {
    return false;
  }

  if (isTokenExpired(token)) {
    clearAuth();
    return false;
  }

  return true;
};

export const clearAuth = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
  }
};

export const setAuth = (token: string, user: User): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userName", user.userName);
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const getAuthHeaders = (): { [key: string]: string } => {
  const token = getAuthToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  return {
    "Content-Type": "application/json",
  };
};
