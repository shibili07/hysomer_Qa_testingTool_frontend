import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api-client";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckComplete, setIsCheckComplete] = useState(false);
  const { setUser } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      if (location.pathname === "/login") {
        setIsCheckComplete(true);
        return;
      }

      try {
        const res = await apiFetch("/api/auth/me");

        if (res.status === 401) {
          setUser(null);
          toast.error("Session expired. Please login again.");
          navigate("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }

        setIsCheckComplete(true);
      } catch (error) {
        setUser(null);
        navigate("/login");
      }
    };

    checkAuth();
  }, [location.pathname, navigate, setUser]);

  if (!isCheckComplete && location.pathname !== "/login") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
