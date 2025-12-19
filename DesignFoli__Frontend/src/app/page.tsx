"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Banner from "@/app/components/Banner";
import WorkTab from "@/app/components/WorkTab";
import AboutMeTab from "@/app/components/AboutMeTab";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserInfo } from "../../types/general";

const HomePage = ({ params }: { params: Promise<{ userName: string }> }) => {
  console.log("Params:", params);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { state, logout } = useAuth();
  const router = useRouter();

  // Helper function to construct full URLs from relative paths
  const getFullUrl = (url: string): string => {
    if (!url) return "";

    // If URL already starts with http/https, return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // If URL starts with / (relative path), prepend API base URL
    if (url.startsWith("/")) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      return `${apiBaseUrl}${url}`;
    }

    // Return as is for other cases
    return url;
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!state.token) return;

    setProfileLoading(true);
    setProfileError(null);

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
        // throw new Error(`HTTP error! status: ${response.status}`);
        console.error("Failed to fetch profile, status:", response.status);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
        // Convert API response to UserInfo format for existing components
        const names = result.data.username
          ? result.data.username.split(" ")
          : ["", ""];
      } else {
        throw new Error(result.error || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileError(
        error instanceof Error ? error.message : "Failed to load profile"
      );

      // Redirect to signup confirmation if no valid response
      router.push("/signup/signupConfirm");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && state.token && state.user) {
      fetchUserProfile();
    }
  }, [isHydrated, state.token, state.user]);

  // Prevent hydration mismatch by not rendering dynamic content until hydrated
  if (!isHydrated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute requireAuth={true}>
      {/* Authentication Status */}

      {/* Profile Loading/Error States */}

      <Banner userInfo={user} publicProfile={false} />

      {/* tabs design start */}
      <div className="flex flex-col  w-full items-center">
        <div className="w-full container mx-auto px-4">
          {" "}
          <Tabs defaultValue="work" className="w-full mb-10">
            <div className=" w-full">
              <TabsList className="flex gap-4 bg-transparent border-none">
                <TabsTrigger
                  value="work"
                  className="px-6 py-2 rounded-5xl font-semibold transition-all bg-white shadow data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white data-[state=active]:border-black data-[state=active]:border-2 rounded-full "
                >
                  Work
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="px-6 py-2 rounded-5xl font-semibold transition-all bg-white shadow data-[state=active]:bg-[#1A1A1A]  data-[state=active]:text-white data-[state=active]:border-black data-[state=active]:border-2 rounded-full"
                >
                  About Me
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="w-full flex justify-center mb-4">
              <div className="h-0.25 w-full bg-gray-200 rounded-5xl" />
            </div>
            <TabsContent value="work">
              <WorkTab
                publicProfile={false}
                workExperience={user?.profile?.caseStudies}
                onCaseStudyUpdate={fetchUserProfile}
              />
            </TabsContent>
            <TabsContent value="about">
              <AboutMeTab
                publicProfile={false}
                userInfo={user}
                onUserInfoUpdate={fetchUserProfile}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* tabs design start */}
    </ProtectedRoute>
  );
};

export default HomePage;
