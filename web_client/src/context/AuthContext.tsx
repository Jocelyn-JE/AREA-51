import { createContext, useState, useEffect, useContext, type ReactNode } from "react";

// Define types
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create context with proper typing
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async (): Promise<void> => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/info`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to verify token');
        }

        const user = await response.json();
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (error) {
        console.error('Disconnected');
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const loginRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!loginRes.ok) {
        throw new Error('Login failed');
      }

      const data = await loginRes.json();
      const { token } = data;

      const userInfoRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userInfoRes.ok) {
        throw new Error('Failed to fetch user info after login');
      }

      const userInfoData = await userInfoRes.json();

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userInfoData));
      setUser(userInfoData);
      window.location.href = "/areas";
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw so calling component can handle it
    }
  };

  const logout = (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    loading,
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
