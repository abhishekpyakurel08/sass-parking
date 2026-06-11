"use client";

import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { authService } from "../lib/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const setUser = useStore((s) => s.setUser);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch (err) {
        console.error("Failed to restore user session:", err);
        // Clear token if invalid
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [setUser]);

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 500 }}>Loading ParkSaaS...</div>
      </div>
    );
  }

  return <>{children}</>;
}
