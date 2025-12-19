"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Form & Validation Imports
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// UI Components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FileUploadCard from "@/app/components/FileUploadCard";

// Utils & Contexts
import { useAuth } from "@/contexts/AuthContext";
import { getFullUrl } from "@/lib/utils";
import { showToast } from "@/lib/toast";

// --- Types ---
interface UserProfileResponse {
  username?: string;
  firebasePhotoURL?: string;
  profile?: {
    displayName?: string;
    bio?: string;
    experience?: Array<{
      title: string;
      companyName: string;
      introduction: string;
      employmentType: string;
      locationMode: string;
      startDate: string;
      endDate?: string;
      currentlyWorking: boolean;
      country: string;
      city: string;
    }>;
  };
  professionalInfo?: {
    title?: string;
    companyName?: string;
    introduction?: string;
  };
  resumeURL?: string;
}

// --- Zod Schema ---
const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(3, { message: "User name must be at least 3 characters." })
    .max(30, { message: "User name must be at most 30 characters." }),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(50, { message: "Title must be at most 50 characters." }),
  companyName: z.string().min(3, { message: "Company name must be at least 3 characters." }).max(50, { message: "Company name must be at most 50 characters." }),
  introText: z
    .string()
    .max(200, { message: "Bio must be at most 200 characters." })
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const EditProfilePage = () => {
  const { state } = useAuth();
  const router = useRouter();

  // Local state for files/images (separate from text form)
  const [imgUrl, setImgUrl] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      title: "",
      companyName: "",
      introText: "",
    },
  });

  // --- Helper: Extract filename ---
  const getFileNameFromURL = (
    url: string
  ): { name: string; extension: string } => {
    if (!url) return { name: "", extension: "" };
    const urlParts = url.split("/");
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const lastDotIndex = fileNameWithExtension.lastIndexOf(".");
    if (lastDotIndex === -1)
      return { name: fileNameWithExtension, extension: "" };
    return {
      name: fileNameWithExtension.substring(0, lastDotIndex),
      extension: fileNameWithExtension
        .substring(lastDotIndex + 1)
        .toUpperCase(),
    };
  };

  // --- 1. Fetch Profile Data ---
  const fetchProfile = async () => {
    if (!state.token) return;

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.success && result.data) {
        const data: UserProfileResponse = result.data;

        // Populate Form Fields
        form.reset({
          displayName: data.profile?.displayName || "",
          title: data.professionalInfo?.title || "",
          companyName: data.professionalInfo?.companyName || "",
          introText:
            data.professionalInfo?.introduction || data.profile?.bio || "",
        });

        // Set Image & Resume State
        setImgUrl(data.firebasePhotoURL || "");
        setResumeUrl(data.resumeURL || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast.error("Failed to load profile data");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (state.token) {
      fetchProfile();
    }
  }, [state.token]);

  // --- 2. Handle Image Selection ---
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/heic"];

      if (!validTypes.includes(file.type)) {
        showToast.error(
          "Error: Invalid file format. Allowed: jpg, png, jpeg, heic."
        );
        return;
      }
      if (file.size > 1000000) {
        // 1MB
        showToast.error("Error: File size must be less than 1MB.");
        return;
      }

      setImgUrl(URL.createObjectURL(file)); // Preview
    }
  };

  // --- 3. Handle Form Submission ---
  const onSubmit = async (values: ProfileFormValues) => {
    if (!state.token) {
      showToast.error("Authentication token not available");
      return;
    }

    setIsLoading(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      // Prepare payload structure
      const profileData = {
        professionalInfo: {
          title: values.title,
          companyName: values.companyName,
          introduction: values.introText,
        },
        profile: {
          displayName: values.displayName.trim(),
          bio: values.introText,
        },
      };

      // Determine if we need FormData (for files) or simple JSON
      const hasImageFile = fileInputRef.current?.files?.[0];
      const hasResumeFile = resumeFile;

      let response;

      if (hasImageFile || hasResumeFile) {
        const formData = new FormData();
        formData.append("profileData", JSON.stringify(profileData));
        if (hasResumeFile) formData.append("resume", hasResumeFile);
        if (hasImageFile)
          formData.append("profileImage", fileInputRef.current!.files![0]);

        response = await fetch(`${apiBaseUrl}/api/v1/users/update/profile`, {
          method: "POST",
          headers: { Authorization: `Bearer ${state.token}` },
          body: formData,
        });
      } else {
        // JSON Update
        response = await fetch(`${apiBaseUrl}/api/v1/users/update/profile`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        });
      }

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (!result.success)
        throw new Error(result.error || "Failed to update profile");

      setResumeFile(null); // Reset file input
      await fetchProfile(); // Refresh data
      showToast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast.error(
        error instanceof Error ? error.message : "Failed to save profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen flex flex-col items-center pt-24 pb-5 px-4">
        {/* Header Section */}
        <div className="relative w-full max-w-3xl mt-6 mb-8 flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full text-[#1a1a1a] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]">
            Edit Profile
          </h1>
        </div>

        <div className="w-full max-w-3xl bg-white p-6">
          {/* Profile Image Section (Managed outside React Hook Form) */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md">
                <Image
                  src={
                    getFullUrl(imgUrl) ||
                    "https://media.istockphoto.com/id/1277094540/vector/user-icon-vector-man-icon-account-icon.jpg?s=612x612&w=0&k=20&c=MCu7eJ83Ca72yOSk3TquaijKXCbY6thsIOOmjyseemw="
                  }
                  alt="Profile"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfileImageChange}
                accept="image/png, image/jpeg, image/jpg, image/heic"
                className="hidden"
              />
            </div>
          </div>

          {/* Form Section */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Display Name */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Designation & Company Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="Your job title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Company you work for"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Bio / Intro */}
              <FormField
                control={form.control}
                name="introText"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Sub Heading</FormLabel>
                      <span className="text-sm text-gray-500">
                        {field.value?.length || 0}/200
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Write a short bio (max 200 characters)"
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resume Section (Manual State Control) */}
              <div className="space-y-2">
                <FormLabel>Resume</FormLabel>

                {/* Existing Resume Display */}
                {resumeUrl && !resumeFile && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-3 text-[#6155F5]"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <div>
                          <div className="font-medium text-[#1A1A1A]">
                            Current Resume: {getFileNameFromURL(resumeUrl).name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Format:{" "}
                            {getFileNameFromURL(resumeUrl).extension ||
                              "Unknown"}
                          </div>
                        </div>
                      </div>
                      <a
                        href={getFullUrl(resumeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6155F5] hover:text-[#4942d6] text-sm font-medium"
                      >
                        View →
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Upload a new resume below to replace this one
                    </p>
                  </div>
                )}

                <FileUploadCard
                  onFileSelect={(file) => setResumeFile(file)}
                  acceptedFileTypes=".pdf,.doc,.docx"
                  title="Drag and drop your resume"
                  description="to upload your CV"
                  maxSizeMB={5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-start">
                <Button
                  type="submit"
                  variant="default"
                  className="bg-[#1a1a1a] hover:bg-[#39328f] text-white rounded-4xl px-6 py-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
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
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
