"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";

// ✅ Define schema
const formSchema = z
  .object({
    userName: z
      .string()
      .min(3, { message: "User name must be at least 3 characters." }).max(30, { message: "User name must be at most 30 characters." }),
    title: z.string().min(3, { message: "Title is required." }).max(50, { message: "Title must be at most 50 characters." }),
    companyName: z.string().min(3, { message: "Company name is required." }).max(50, { message: "Company name must be at most 50 characters." }),
    introText: z
      .string()
      .max(200, { message: "Intro text must be at most 200 characters." })
      .optional(),
  })
  .refine((data) => data.userName.length >= 3, {
    message: "User name must be at least 3 characters.",
    path: ["userName"],
  });

const SignupConfirmPage: React.FC = () => {
  const router = useRouter();
  const { state } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      title: "",
      companyName: "",
      introText: "",
    },
  });

  const watchUserName = form.watch("userName");

  // ✅ Load Google user from localStorage & Fetch suggestions
  React.useEffect(() => {
    const storedUser = localStorage.getItem("googleUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      form.setValue("userName", user.displayName || "");
      console.log("Google User:", user);
    }

    if (state.token) {
      fetchSuggestedUsername();
    }
  }, [form, state.token]);

  // Check username availability
  React.useEffect(() => {
    if (watchUserName && watchUserName.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(watchUserName);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setIsUsernameAvailable(null);
    }
  }, [watchUserName]);

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

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.suggestions) {
          setSuggestions(result.data.suggestions);
        }
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!state.token) return;

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

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsUsernameAvailable(result.data.available);
        }
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setIsUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    form.setValue("userName", suggestion, { shouldValidate: true });
  };

  // ✅ Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!state.token) {
      setSubmitError("Authentication token not found. Please try logging in again.");
      return;
    }

    if (isUsernameAvailable === false) {
      form.setError("userName", { message: "This username is not available" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("✅ Confirmed Data:", values);

      // Prepare data for external API
      const registrationData = {
        username: values.userName,
        title: values.title || "",
        companyName: values.companyName || "",
        introduction: values.introText || "",
      };

      console.log("� Sending registration data:", registrationData);

      // Call external API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Registration successful:", result);

      if (result.success && result.user) {
        // Clear stored Google user data
        localStorage.removeItem("googleUser");

        showToast.success("Account setup complete!");
        router.push("/");
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      // console.error("❌ Error submitting form:", error);
      setSubmitError(error instanceof Error ? error.message : "Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-gradient-to-t from-white/60 via-blue-400/60 to-purple-300/60 backdrop-blur-lg flex min-h-screen flex-col items-center justify-center">
      <div className="bg-white py-5 px-10 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg">
        <h2 className="text-4xl py-2 font-bold bg-gradient-to-r from-[#6155F5] to-[#39328f] bg-clip-text text-transparent mb-5">
          DesignFoli
        </h2>
        <h2 className="text-lg font-semibold mb-6">Finishing Signing up</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 flex flex-col gap-2">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Name</FormLabel>

                  {/* Suggestions UI */}
                  {suggestions.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">Suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSelectSuggestion(s)}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <FormControl>
                    <Input placeholder="Example: JohnDoe" {...field} />
                  </FormControl>

                  {/* Availability Feedback */}
                  {isCheckingUsername && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-2"></span>
                      Checking availability...
                    </p>
                  )}
                  {!isCheckingUsername && field.value && field.value.length >= 3 && isUsernameAvailable !== null && (
                    <p className={`text-xs flex items-center mt-1 ${isUsernameAvailable ? "text-green-600" : "text-red-600"}`}>
                      {isUsernameAvailable ? (
                        <>
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Username available
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Username taken
                        </>
                      )}
                    </p>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Example: Software Engineer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Example: ABC Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="introText"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Introduction</FormLabel>
                    <span className="text-xs text-gray-500">
                      {field.value?.length || 0}/200
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Example: Product designer with 5 years of experience..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-4xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Confirm"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-gray-900 mt-3">
          By confirming, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

export default SignupConfirmPage;
