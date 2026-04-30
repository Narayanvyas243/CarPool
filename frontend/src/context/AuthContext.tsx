import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getApiUrl } from "../apiConfig";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  gender?: string;
  phone?: string;
  upiId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  updateUser: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("carpool_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user?.id) {
      fetch(getApiUrl(`/api/users/${user.id}`))
        .then(res => res.json())
        .then(data => {
          if (data._id) {
            const updatedUser = {
              id: data._id,
              name: data.name,
              email: data.email,
              role: data.role,
              gender: data.gender,
              phone: data.phone,
              upiId: data.upiId
            };
            // Only update if there's a difference to avoid infinite loops
            if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
              localStorage.setItem("carpool_user", JSON.stringify(updatedUser));
              setUser(updatedUser);
            }
          }
        })
        .catch(err => console.error("Failed to refresh user profile:", err));
    }
  }, []);

  const login = (userData: User) => {
    localStorage.setItem("carpool_user", JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem("carpool_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("carpool_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
