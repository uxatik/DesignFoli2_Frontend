"use client";
import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";
import { UserInfo } from "../../../types/general";
import { usePathname } from "next/navigation";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const { state } = useAuth();
  const pathname = usePathname();

  // Pages that should not show Navbar/Footer (login, signup, etc.)
  const noLayoutPages = ["/login", "/signup", "/signup/signupConfirm", "/signup/signupWithEmail"];
  const shouldShowLayout = !noLayoutPages.includes(pathname);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!state.token) return;

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch profile, status:", response.status);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    if (shouldShowLayout && state.token && state.user) {
      fetchUserProfile();
    }
  }, [shouldShowLayout, state.token, state.user]);

  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer userInfo={user} publicProfile={false} />
    </>
  );
}
