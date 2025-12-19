"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function PublishPage() {
  const router = useRouter();
  const { state, updateProfile } = useAuth();
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentFullname, setCurrentFullname] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<
    boolean | null
  >(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch suggested username on component mount
  useEffect(() => {
    if (state.token) {
      fetchSuggestedUsername();
    }
  }, [state.token]);

  // Check username availability when user types
  useEffect(() => {
    if (username.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(username);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setIsUsernameAvailable(null);
    }
  }, [username]);

  const fetchSuggestedUsername = async () => {
    if (!state.token) return;

    setIsLoadingSuggestion(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/suggest-username`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        if (result.data.currentUsername) {
          setCurrentUsername(result.data.currentUsername);
        }
        if (result.data.currentFullname) {
          setCurrentFullname(result.data.currentFullname);
          setFullname(result.data.currentFullname);
        }
        if (result.data.suggestions && result.data.suggestions.length > 0) {
          setSuggestions(result.data.suggestions);
          // Set first suggestion as default username
          setUsername(result.data.suggestions[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching suggested username:", error);
      showToast.error("Failed to fetch suggested username");
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!state.token || !usernameToCheck) return;

    setIsCheckingUsername(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/check-username?username=${encodeURIComponent(
          usernameToCheck
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setIsUsernameAvailable(result.data.available);
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setIsUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUseSuggestedUsername = () => {
    if (suggestions.length > 0) {
      setUsername(suggestions[0]);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setUsername(suggestion);
  };

  const handlePublish = async () => {
    if (!state.token) {
      showToast.error("Authentication required");
      return;
    }

    if (!username || username.length < 3) {
      showToast.error("Username must be at least 3 characters");
      return;
    }

    if (isUsernameAvailable === false) {
      showToast.error("This username is not available");
      return;
    }

    setIsPublishing(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/set-username-and-publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            fullname,
            isPublished: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showToast.success("Portfolio published successfully!");
        // Update user profile display name

        // Redirect to home page after successful publish
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        throw new Error(result.error || "Failed to publish portfolio");
      }
    } catch (error) {
      console.error("Error publishing portfolio:", error);
      showToast.error(
        error instanceof Error ? error.message : "Failed to publish portfolio"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pt-24 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Publish Your Portfolio</h1>
            <p className="text-gray-600">
              Choose a username and make your portfolio live
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="space-y-6">
              {/* Suggested Usernames Section */}
              {isLoadingSuggestion ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#6155F5]"></div>
                  <p className="mt-2 text-gray-600">
                    Loading suggested usernames...
                  </p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Suggested usernames:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          username === suggestion
                            ? "border-[#6155F5] bg-[#6155F5] text-white"
                            : "border-gray-200 hover:border-[#6155F5] bg-white hover:bg-blue-50"
                        }`}
                      >
                        <div className="font-medium">{suggestion}</div>
                        <div className="text-xs mt-1 opacity-75">
                          Click to select
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full"
                  minLength={3}
                />

                {/* Username validation feedback */}
                {isCheckingUsername && (
                  <p className="text-sm text-gray-500 flex items-center">
                    <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></span>
                    Checking availability...
                  </p>
                )}

                {!isCheckingUsername && username.length >= 3 && (
                  <>
                    {isUsernameAvailable === true && (
                      <p className="text-sm text-green-600 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Username is available!
                      </p>
                    )}

                    {isUsernameAvailable === false && (
                      <p className="text-sm text-red-600 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Username is already taken
                      </p>
                    )}
                  </>
                )}

                {username.length > 0 && username.length < 3 && (
                  <p className="text-sm text-gray-500">
                    Username must be at least 3 characters
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Before you publish:
                </h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-[#6155F5] mr-2">•</span>
                    Your username will be part of your portfolio URL
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#6155F5] mr-2">•</span>
                    Make sure your portfolio is complete and ready to share
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#6155F5] mr-2">•</span>
                    You can always update your portfolio after publishing
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="flex-1"
                  disabled={isPublishing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  className="flex-1 bg-[#6155F5] hover:bg-[#4942d6] text-white"
                  disabled={
                    isPublishing ||
                    !username ||
                    username.length < 3 ||
                    isUsernameAvailable === false ||
                    isCheckingUsername
                  }
                >
                  {isPublishing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Publishing...
                    </>
                  ) : (
                    "Publish Portfolio"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
