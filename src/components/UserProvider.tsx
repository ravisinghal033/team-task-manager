"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/client-fetch";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type UserContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hideNav = pathname === "/login" || pathname === "/signup";

  const refreshUser = useCallback(async () => {
    if (hideNav) return;
    try {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: SessionUser };
      setUser(data.user);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[UserProvider] refresh failed:", err);
      }
      setUser(null);
    }
  }, [hideNav]);

  useEffect(() => {
    if (hideNav) {
      setLoading(false);
      setUser(null);
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    if (process.env.NODE_ENV === "development") {
      console.log("[UserProvider] fetch /api/auth/me");
    }

    void (async () => {
      try {
        const res = await apiFetch("/api/auth/me", { signal: controller.signal });
        if (ignore) return;

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = (await res.json()) as { user: SessionUser };
        if (!ignore) setUser(data.user);
      } catch (err) {
        if (controller.signal.aborted) {
          if (process.env.NODE_ENV === "development") {
            console.log("[UserProvider] /api/auth/me aborted");
          }
          return;
        }
        if ((err as Error)?.name === "AbortError") return;
        if (!ignore) setUser(null);
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [hideNav]);

  const value = useMemo(
    () => ({ user, loading, refreshUser }),
    [user, loading, refreshUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useSessionUser() {
  return useContext(UserContext);
}
