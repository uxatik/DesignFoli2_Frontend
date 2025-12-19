"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Banner from "@/app/components/Banner";
import WorkTab from "@/app/components/WorkTab";
import AboutMeTab from "@/app/components/AboutMeTab";
import { UserInfo } from "../../../types/general";
import { useAuth } from "@/contexts/AuthContext";

const PreviewPage = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const router = useRouter();
  const { state } = useAuth();

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

  // Fetch authenticated user profile data
  const fetchAuthenticatedUserProfile = async () => {
    if (!state.token) {
      router.push("/login");
      return;
    }

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
        if (response.status === 404) {
          throw new Error("User not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching authenticated user profile:", error);
      setProfileError(
        error instanceof Error ? error.message : "Failed to load profile"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthenticatedUserProfile();
  }, []);

  // Helper function to get user image URL
  const getUserImage = (): string => {
    if (user?.firebasePhotoURL) {
      return getFullUrl(user.firebasePhotoURL);
    }
    return "/assets/images/user.png";
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Loading preview...</span>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Preview Not Available
          </h1>
          <p className="text-gray-600 mb-4">{profileError}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#6155F5] text-white px-6 py-2 rounded-full font-medium hover:bg-[#39328f] transition mr-2"
          >
            Go Home
          </button>
          <button
            onClick={() => router.push("/editprofile")}
            className="bg-[#25A1F4] text-white px-6 py-2 rounded-full font-medium hover:bg-[#39328f] transition"
          >
            Edit Profile
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Profile Data
          </h1>
          <p className="text-gray-600 mb-4">
            Please create your profile first to see the preview.
          </p>
          <button
            onClick={() => router.push("/editprofile")}
            className="bg-[#6155F5] text-white px-6 py-2 rounded-full font-medium hover:bg-[#39328f] transition"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Preview Badge */}
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
        📋 Preview Mode
      </div>

      {/* Profile Loading/Error States */}
      {profileLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-4 mt-4 max-w-md">
          <p className="text-sm text-blue-800">Loading preview...</p>
        </div>
      )}

      <Banner userInfo={user} publicProfile={true} />

      {/* tabs design start */}
      <div className="flex flex-col w-full items-center">
        <div className="w-full container mx-auto px-4">
          <Tabs defaultValue="work" className="w-full mb-10">
            <div className="w-full">
              <TabsList className="flex gap-4 bg-transparent border-none">
                <TabsTrigger
                  value="work"
                  className="px-6 py-2 rounded-5xl font-semibold transition-all bg-white shadow data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white data-[state=active]:border-black data-[state=active]:border-2 rounded-full"
                >
                  Work
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="px-6 py-2 rounded-5xl font-semibold transition-all bg-white shadow data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white data-[state=active]:border-black data-[state=active]:border-2 rounded-full"
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
                publicProfile={true}
                workExperience={user?.profile?.caseStudies}
              />
            </TabsContent>
            <TabsContent value="about">
              <AboutMeTab publicProfile={true} userInfo={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* tabs design end */}
    </>
  );
};

export default PreviewPage;
