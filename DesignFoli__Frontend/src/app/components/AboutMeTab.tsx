"use clint";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  // DialogDescription, // REMOVED
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { UserInfo, Education, Skill } from "../../../types/general";

// Imports for Shadcn Select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Imports for Country/City
import { Country, City } from "country-state-city";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

// Shadcn `cn` utility function
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Experience {
  _id?: string;
  title: string;
  companyName: string;
  employmentType: string;
  locationMode?: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  introduction?: string;
  country?: string;
  city?: string;
}

// Interface for Experience Form State
interface ExperienceFormState {
  jobTitle: string;
  company: string;
  introduction: string;
  employmentType: string;
  locationMode: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  country: string; // This will be ISO code
  city: string; // This will be city name
}

// Interface for Education Form State
interface EducationFormState {
  institution: string;
  degree: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
}

interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  dribbble?: string;
  instagram?: string;
  behance?: string;
}

interface AboutMeTabProps {
  publicProfile?: boolean;
  userInfo: UserInfo | null;
  onUserInfoUpdate?: () => void;
}

const AboutMeTab = ({
  publicProfile = false,
  userInfo,
  onUserInfoUpdate,
}: AboutMeTabProps) => {
  // Modal state
  const [openModal, setOpenModal] = useState<
    "experience" | "education" | "skill" | "social" | null
  >(null);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(
    null
  );

  // Real data state
  const [loadingData, setLoadingData] = useState(true);
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [currentlyStudying, setCurrentlyStudying] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(
    null
  );
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  // Get auth token
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);

  // API base URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Social links state
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    twitter: userInfo?.profile?.socialLinks?.twitter || "",
    linkedin: userInfo?.profile?.socialLinks?.linkedin || "",
    github: userInfo?.profile?.socialLinks?.github || "",
    dribbble: userInfo?.profile?.socialLinks?.dribbble || "",
    instagram: userInfo?.profile?.socialLinks?.instagram || "",
    behance: userInfo?.profile?.socialLinks?.behance || "",
  });
  const [isSavingSocialLinks, setIsSavingSocialLinks] = useState(false);

  // Form state for Experience Modal
  const [expForm, setExpForm] = useState<ExperienceFormState>({
    jobTitle: "",
    company: "",
    introduction: "",
    employmentType: "",
    locationMode: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    country: "",
    city: "",
  });

  // Form state for Education Modal
  const [eduForm, setEduForm] = useState<EducationFormState>({
    institution: "",
    degree: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
  });

  // Memoized data for dropdowns
  const monthOptions = useMemo(
    () => [
      { value: "01", label: "January" },
      { value: "02", label: "February" },
      { value: "03", label: "March" },
      { value: "04", label: "April" },
      { value: "05", label: "May" },
      { value: "06", label: "June" },
      { value: "07", label: "July" },
      { value: "08", label: "August" },
      { value: "09", label: "September" },
      { value: "10", label: "October" },
      { value: "11", label: "November" },
      { value: "12", label: "December" },
    ],
    []
  );

  const yearOptions = useMemo(() => {
    return Array.from(
      { length: 50 },
      (_, i) => new Date().getFullYear() - i
    ).map((year) => ({
      value: year.toString(),
      label: year.toString(),
    }));
  }, []);

  const employmentTypeOptions = useMemo(
    () => [
      { value: "full-time", label: "Full-time" },
      { value: "part-time", label: "Part-time" },
      { value: "contract", label: "Contract" },
      { value: "freelance", label: "Freelance" },
      { value: "internship", label: "Internship" },
      { value: "volunteer", label: "Volunteer" },
    ],
    []
  );

  const locationModeOptions = useMemo(
    () => [
      { value: "onsite", label: "On-site" },
      { value: "remote", label: "Remote" },
      { value: "hybrid", label: "Hybrid" },
    ],
    []
  );

  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().map((c) => ({
        label: c.name,
        value: c.isoCode,
      })),
    []
  );

  // Added a uniqueKey to solve the React key warning
  const cityOptions = useMemo(() => {
    if (!expForm.country) return [];
    return (
      City.getCitiesOfCountry(expForm.country)?.map((c) => ({
        label: c.name,
        value: c.name,
        uniqueKey: `${c.name}-${c.stateCode}`, // Create a unique key
      })) || []
    );
  }, [expForm.country]);

  // Handle social link changes
  const handleSocialLinkChange = (
    platform: keyof SocialLinks,
    value: string
  ) => {
    setSocialLinks((prev) => ({
      ...prev,
      [platform]: value,
    }));
  };

  // Save social links to API
  const saveSocialLinks = async () => {
    setIsSavingSocialLinks(true);
    try {
      // Filter out empty links
      const linksToSave = Object.fromEntries(Object.entries(socialLinks));

      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/profile/social-links`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(linksToSave),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check if it's a validation error with field details
        if (
          errorData.error?.code === "VALIDATION_ERROR" &&
          errorData.error?.details &&
          Array.isArray(errorData.error.details)
        ) {
          // Extract field-level validation errors
          const fieldErrors = errorData.error.details
            .map(
              (detail: { field: string; message: string }) =>
                `${detail.field}: ${detail.message}`
            )
            .join(", ");
          showToast.error(`Validation error - ${fieldErrors}`);
          return;
        }

        throw new Error("Failed to save social links");
      }

      showToast.success("Social links saved successfully!");
      setOpenModal(null);

      // Refresh user data
      if (onUserInfoUpdate) {
        onUserInfoUpdate();
      }
    } catch (error) {
      console.error("Error saving social links:", error);
      showToast.error("Failed to save social links. Please try again.");
    } finally {
      setIsSavingSocialLinks(false);
    }
  };

  // Handle edit experience
  const handleEditExperience = (experience: Experience) => {
    setEditingExperience(experience);
    setOpenModal("experience");
  };

  // Handle delete experience
  const handleDeleteExperience = async (experienceId?: string) => {
    if (!experienceId) return;

    if (confirm("Are you sure you want to delete this experience?")) {
      try {
        setLoading(true);

        const response = await fetch(
          `${apiBaseUrl}/api/v1/users/profile/experience/${experienceId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete experience");
        }

        console.log("Experience deleted successfully:", experienceId);

        // Refresh the user data to show the updated experience list
        if (onUserInfoUpdate) {
          onUserInfoUpdate();
        }
      } catch (error) {
        console.error("Error deleting experience:", error);
        showToast.error("Failed to delete experience. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle update experience using state
  const handleUpdateExperience = async (
    e: React.FormEvent,
    experienceId?: string
  ) => {
    if (!experienceId) return;

    e.preventDefault();
    setLoading(true);

    try {
      // Read from state, not FormData
      const {
        jobTitle,
        company,
        introduction,
        employmentType,
        locationMode,
        startMonth,
        startYear,
        endMonth,
        endYear,
        country, // This is ISO code
        city,
      } = expForm;

      // Create start date
      const startDate = new Date(
        parseInt(startYear),
        parseInt(startMonth) - 1,
        1
      );

      // Create end date (if not currently working)
      let endDate: Date | undefined;
      if (!currentlyWorking && endMonth && endYear) {
        endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
      }

      // Find country name from ISO code (as API expects name)
      const countryName = Country.getCountryByCode(country)?.name || country;

      // Prepare data according to backend model
      const experienceData = {
        title: jobTitle,
        companyName: company,
        introduction: introduction || `${jobTitle} at ${company}`,
        employmentType,
        locationMode: locationMode || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : undefined,
        currentlyWorking,
        country: countryName, // Send country name
        city,
      };

      // Call PUT API endpoint
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/profile/experience/${experienceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(experienceData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update experience");
      }

      const data = await response.json();
      console.log("Experience updated successfully:", data);
      setOpenModal(null);
      setEditingExperience(null);

      // Refresh the user data to show the updated experience
      if (onUserInfoUpdate) {
        onUserInfoUpdate();
      }
    } catch (error) {
      console.error("Error updating experience:", error);
      showToast.error("Failed to update experience. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox change
  const handleCurrentlyWorkingChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentlyWorking(e.target.checked);
  };

  // Parse date to month and year
  const parseDateToMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: (date.getMonth() + 1).toString().padStart(2, "0"),
      year: date.getFullYear().toString(),
    };
  };

  // Set currently working state AND form data when editing experience
  useEffect(() => {
    if (editingExperience && openModal === "experience") {
      setCurrentlyWorking(editingExperience.currentlyWorking);

      const startDate = parseDateToMonthYear(editingExperience.startDate);
      const endDate = editingExperience.endDate
        ? parseDateToMonthYear(editingExperience.endDate)
        : { month: "", year: "" };

      // Find country ISO code from name (editingExperience stores name)
      const countryIso =
        Country.getAllCountries().find(
          (c) => c.name === editingExperience.country
        )?.isoCode || "";

      setExpForm({
        jobTitle: editingExperience.title || "",
        company: editingExperience.companyName || "",
        introduction: editingExperience.introduction || "",
        employmentType: editingExperience.employmentType || "",
        locationMode: editingExperience.locationMode || "",
        startMonth: startDate.month,
        startYear: startDate.year,
        endMonth: endDate.month,
        endYear: endDate.year,
        country: countryIso, // Store ISO code in state
        city: editingExperience.city || "",
      });
    } else if (!editingExperience && openModal === "experience") {
      // Clear form when opening for "Add"
      setExpForm({
        jobTitle: "",
        company: "",
        introduction: "",
        employmentType: "",
        locationMode: "",
        startMonth: "",
        startYear: "",
        endMonth: "",
        endYear: "",
        country: "",
        city: "",
      });
      setCurrentlyWorking(false);
    }
  }, [editingExperience, openModal]);

  // Refresh work experience data
  const refreshWorkExperience = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const result = await response.json();
      const userData = result.data;

      if (userData?.profile?.experience) {
        //setWorkExperience(userData.profile.experience);
      }
    } catch (error) {
      console.error("Error refreshing work experience:", error);
    }
  };

  // Education API functions using state
  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Read from state
      const { institution, degree, startMonth, startYear, endMonth, endYear } =
        eduForm;

      // Create start date
      const startDate = new Date(
        parseInt(startYear),
        parseInt(startMonth) - 1,
        1
      );

      // Create end date (if not currently studying)
      let endDate: Date | undefined;
      if (!currentlyStudying && endMonth && endYear) {
        endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
      }

      // Prepare data according to backend model
      const educationData = {
        institution,
        degree,
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : undefined,
        current: currentlyStudying,
      };

      // Make API call
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/profile/addEducation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(educationData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add education");
      }

      const data = await response.json();
      console.log("Education added successfully:", data);
      setOpenModal(null);

      // Refresh the user data to show the newly added education
      if (onUserInfoUpdate) {
        onUserInfoUpdate();
      }
    } catch (error) {
      console.error("Error adding education:", error);
      showToast.error("Failed to add education. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditEducation = (education: Education) => {
    setEditingEducation(education);
    setOpenModal("education");
  };

  // Update education using state
  const handleUpdateEducation = async (
    e: React.FormEvent,
    educationId?: string
  ) => {
    if (!educationId) return;

    e.preventDefault();
    setLoading(true);

    try {
      // Read from state
      const { institution, degree, startMonth, startYear, endMonth, endYear } =
        eduForm;

      // Create start date
      const startDate = new Date(
        parseInt(startYear),
        parseInt(startMonth) - 1,
        1
      );

      // Create end date (if not currently studying)
      let endDate: Date | undefined;
      if (!currentlyStudying && endMonth && endYear) {
        endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
      }

      // Prepare data according to backend model
      const educationData = {
        institution,
        degree,
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : undefined,
        current: currentlyStudying,
      };

      // Call PUT API endpoint
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/profile/education/${educationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(educationData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update education");
      }

      const data = await response.json();
      console.log("Education updated successfully:", data);
      setOpenModal(null);
      setEditingEducation(null);

      // Refresh the user data to show the updated education
      if (onUserInfoUpdate) {
        onUserInfoUpdate();
      }
    } catch (error) {
      console.error("Error updating education:", error);
      showToast.error("Failed to update education. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEducation = async (educationId?: string) => {
    if (!educationId) return;

    if (confirm("Are you sure you want to delete this education?")) {
      try {
        setLoading(true);

        const response = await fetch(
          `${apiBaseUrl}/api/v1/users/profile/education/${educationId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete education");
        }

        console.log("Education deleted successfully:", educationId);

        // Refresh the user data to show the updated education list
        if (onUserInfoUpdate) {
          onUserInfoUpdate();
        }
      } catch (error) {
        console.error("Error deleting education:", error);
        showToast.error("Failed to delete education. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Set currently studying state AND form data when editing education
  useEffect(() => {
    if (editingEducation && openModal === "education") {
      setCurrentlyStudying(editingEducation.current);

      const startDate = parseDateToMonthYear(editingEducation.startDate);
      const endDate = editingEducation.endDate
        ? parseDateToMonthYear(editingEducation.endDate)
        : { month: "", year: "" };

      setEduForm({
        institution: editingEducation.institution || "",
        degree: editingEducation.degree || "",
        startMonth: startDate.month,
        startYear: startDate.year,
        endMonth: endDate.month,
        endYear: endDate.year,
      });
    } else if (!editingEducation && openModal === "education") {
      // Clear form
      setEduForm({
        institution: "",
        degree: "",
        startMonth: "",
        startYear: "",
        endMonth: "",
        endYear: "",
      });
      setCurrentlyStudying(false);
    }
  }, [editingEducation, openModal]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  // Format duration for display
  const formatDuration = (
    startDate: string,
    endDate?: string,
    current?: boolean
  ) => {
    const start = formatDate(startDate);
    const end = current ? "Present" : endDate ? formatDate(endDate) : "Present";
    return `${start} - ${end}`;
  };

  // Format location for display
  const formatLocation = (country?: string, city?: string) => {
    if (city && country) {
      return `${city}, ${country}`;
    }
    return city || country || "";
  };

  // Form handler for Add Experience using state
  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Read from state
      const {
        jobTitle,
        company,
        introduction,
        employmentType,
        locationMode,
        startMonth,
        startYear,
        endMonth,
        endYear,
        country, // This is ISO code
        city,
      } = expForm;

      // Create start date
      const startDate = new Date(
        parseInt(startYear),
        parseInt(startMonth) - 1,
        1
      );

      // Create end date (if not currently working)
      let endDate: Date | undefined;
      if (!currentlyWorking && endMonth && endYear) {
        endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
      }

      // Find country name from ISO code
      const countryName = Country.getCountryByCode(country)?.name || country;

      // Prepare data according to backend model
      const experienceData = {
        title: jobTitle,
        companyName: company,
        introduction: introduction || `${jobTitle} at ${company}`,
        employmentType,
        locationMode: locationMode || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : undefined,
        currentlyWorking,
        country: countryName, // Send country name
        city,
      };

      // Make API call
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/profile/addExperience`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(experienceData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add experience");
      }

      const data = await response.json();
      console.log("Experience added successfully:", data);
      setOpenModal(null);

      // Refresh the user data to show the newly added experience
      if (onUserInfoUpdate) {
        onUserInfoUpdate();
      } else {
        console.log(
          "No onUserInfoUpdate callback provided, response:",
          response
        );
      }
    } catch (error) {
      console.error("Error adding experience:", error);
      showToast.error("Failed to add experience. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Skill API functions
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);

      // Extract form values
      const category = formData.get("category") as string;
      const name = formData.get("name") as string;

      // Prepare data according to backend model
      const skillData = {
        category,
        name,
      };

      // Make API call
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/profile/addSkill`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(skillData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add skill");
      }

      const data = await response.json();
      console.log("Skill added successfully:", data);
      setOpenModal(null);

      // Refresh the user data to show the newly added skill
      if (onUserInfoUpdate) {
        onUserInfoUpdate();
      }
    } catch (error) {
      console.error("Error adding skill:", error);
      showToast.error("Failed to add skill. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setOpenModal("skill");
  };

  const handleUpdateSkill = async (e: React.FormEvent, skillId?: string) => {
    if (!skillId) return;

    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);

      // Extract form values
      const category = formData.get("category") as string;
      const name = formData.get("name") as string;

      // Prepare data according to backend model
      const skillData = {
        category,
        name,
      };

      // Call PUT API endpoint
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/profile/skill/${skillId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify(skillData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update skill");
      }

      const data = await response.json();
      console.log("Skill updated successfully:", data);
      setOpenModal(null);
      setEditingSkill(null);

      // Refresh the user data to show the updated skill
      if (onUserInfoUpdate) {
        onUserInfoUpdate();
      }
    } catch (error) {
      console.error("Error updating skill:", error);
      showToast.error("Failed to update skill. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async (skillId?: string) => {
    if (!skillId) return;

    if (confirm("Are you sure you want to delete this skill?")) {
      try {
        setLoading(true);

        const response = await fetch(
          `${apiBaseUrl}/api/v1/users/profile/skill/${skillId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete skill");
        }

        console.log("Skill deleted successfully:", skillId);

        // Refresh the user data to show the updated skill list
        if (onUserInfoUpdate) {
          onUserInfoUpdate();
        }
      } catch (error) {
        console.error("Error deleting skill:", error);
        showToast.error("Failed to delete skill. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to get social media icon based on platform
  const getSocialIcon = (platform: string) => {
    const iconSize = 16;
    const iconColor = "#000000";

    switch (platform.toLowerCase()) {
      case "twitter":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
            viewBox="0 0 24 24"
            className="text-[#000000]"
          >
            <path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 0 0 1.88-2.37c-.83.5-1.75.87-2.72 1.07A4.28 4.28 0 0 0 12 9.03c0 .34.04.67.1.99C8.09 9.86 4.84 8.13 2.67 5.44c-.37.64-.58 1.39-.58 2.19 0 1.51.77 2.85 1.94 3.63-.72-.02-1.4-.22-1.99-.55v.06c0 2.11 1.5 3.87 3.5 4.27-.37.1-.76.16-1.16.16-.28 0-.55-.03-.81-.08.55 1.72 2.16 2.97 4.07 3a8.6 8.6 0 0 1-5.32 1.84c-.35 0-.7-.02-1.04-.06A12.13 12.13 0 0 0 8.29 21c7.55 0 11.69-6.26 11.69-11.69 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 24 4.59a8.36 8.36 0 0 1-2.54.7z" />
          </svg>
        );
      case "linkedin":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
            viewBox="0 0 24 24"
            className="text-[#000000]"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        );
      case "github":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
            viewBox="0 0 24 24"
            className="text-[#000000]"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        );
      case "dribbble":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
            viewBox="0 0 24 24"
            className="text-[#000000]"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm9.568 5.302c.26.646.422 1.332.422 2.058 0 .337-.034.665-.092.987-.31-.092-.678-.17-1.097-.232-1.448-.211-3.126-.211-4.574 0-.421.062-.787.14-1.097.232-.058-.322-.092-.65-.092-.987 0-.726.162-1.412.422-2.058C7.835 3.827 9.783 2.5 12 2.5s4.165 1.327 5.568 2.802z" />
          </svg>
        );
      case "instagram":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
            viewBox="0 0 24 24"
            className="text-[#000000]"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      case "behance":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
            viewBox="0 0 24 24"
            className="text-[#000000]"
          >
            <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 2-5.101 2-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            fill="currentColor"
            viewBox="0 0 24 24"
            className="text-[#000000]"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-32 mt-6">
        {/* Work Experience Column */}
        <div>
          <h3 className="text-xl font-semibold mb-6 text-[#1a1a1a]">
            Work Experience
          </h3>
          {userInfo?.profile?.experience?.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-[#1A1A1A]">No work experience added yet.</p>
            </div>
          ) : (
            userInfo?.profile?.experience?.map((job, index) => (
              <div key={job._id || index} className="mb-10 relative group">
                <h4 className="font-medium text-lg text-[#1A1A1A]">
                  {job.companyName}
                </h4>
                <p className="text-[#4D4D4D]">{job.title}</p>
                <p className="text-sm text-[#4D4D4D] mt-1">
                  {formatDuration(
                    job.startDate,
                    job.endDate,
                    job.currentlyWorking
                  )}
                </p>
                {job.introduction && (
                  <p className="text-sm text-[#4D4D4D] mt-2">
                    {job.introduction}
                  </p>
                )}
                <p className="text-sm text-[#666666] mt-3.5">
                  {formatLocation(job.country, job.city)}
                  {job.employmentType && ` • ${job.employmentType}`}
                  {job.locationMode && ` • ${job.locationMode}`}
                </p>

                {!publicProfile && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleEditExperience(job)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteExperience(job._id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
          {!publicProfile && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-full border-[#1a1a1a] hover:bg-gray-100 hover:border-[#1a1a1a] hover:text-[#1a1a1a] cursor-pointer"
              onClick={() => {
                setEditingExperience(null); // Ensure we're adding, not editing
                setOpenModal("experience");
              }}
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
                className="mr-1"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Experience
            </Button>
          )}
        </div>

        {/* Education Column */}
        <div>
          <h3 className="text-xl font-semibold mb-6 text-[#1a1a1a]">
            Education
          </h3>
          {userInfo?.profile?.education?.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No education added yet.</p>
            </div>
          ) : (
            userInfo?.profile?.education?.map((edu, index) => (
              <div key={edu._id || index} className="mb-10 relative group">
                <h4 className="font-medium text-lg">{edu.institution}</h4>
                <p className="text-[#4D4D4D]">{edu.degree}</p>
                <p className="text-sm text-[#6B7280] mt-1">
                  {formatDuration(edu.startDate, edu.endDate, edu.current)}
                </p>

                {!publicProfile && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleEditEducation(edu)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteEducation(edu._id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}

          {!publicProfile && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-full border-[#1a1a1a] hover:bg-gray-100 hover:border-[#1a1a1a] hover:text-[#1a1a1a] cursor-pointer"
              onClick={() => {
                setEditingEducation(null); // Ensure we're adding
                setOpenModal("education");
              }}
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
                className="mr-1"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Education
            </Button>
          )}
        </div>

        {/* Skills Column */}
        <div>
          <h3 className="text-xl font-semibold mb-6 text-[#1a1a1a]">Skills</h3>
          {userInfo?.profile?.skills?.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No skills added yet.</p>
            </div>
          ) : (
            userInfo?.profile?.skills?.map((skill, index) => (
              <div key={skill._id || index} className="mb-10 relative group">
                <h4 className="font-medium text-lg">{skill.category}</h4>
                <p className="text-[#4D4D4D] mt-1">{skill.name}</p>

                {!publicProfile && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleEditSkill(skill)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteSkill(skill._id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
          <div>
            {!publicProfile && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 rounded-full border-[#1a1a1a] hover:bg-gray-100 hover:border-[#1a1a1a] hover:text-[#1a1a1a] cursor-pointer"
                onClick={() => setOpenModal("skill")}
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
                  className="mr-1"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Skill
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="items-center content-center text-center object-center">
        <div className="mt-8 flex flex-col items-center justify-center text-center">
          {/* Display existing social links */}
          {/* <div className="flex justify-center gap-2 w-full max-w-md">
            {Object.entries(socialLinks).map(([platform, url]) => {
              if (!url) return null;
              return (
                <div
                  key={platform}
                  className="flex items-center justify-between p-1  rounded-lg w-full sm:w-auto"
                >
                  <div className="flex items-center gap-3">
                    {getSocialIcon(platform)}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs"
                    >
                      {platform}
                    </a>
                  </div>
                </div>
              );
            })}
            {Object.values(socialLinks).every((link) => !link) && (
              <p className="text-gray-500 text-sm italic text-center py-4 w-full">
                No social media links added yet.
              </p>
            )}
          </div> */}
          {!publicProfile && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-[#1a1a1a] hover:bg-gray-100 hover:border-[#1a1a1a] hover:text-[#1a1a1a] cursor-pointer"
                onClick={() => setOpenModal("social")}
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
                  className="mr-1"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Media Link
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Social Media Modal */}
      <Dialog
        open={openModal === "social"}
        onOpenChange={() => setOpenModal(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Social Media Links</DialogTitle>
            {/* REMOVED DialogDescription */}
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Twitter */}
            <div className=" flex items-center gap-2 ">
              <Label
                htmlFor="twitter"
                className="flex items-center gap-2 border h-9  px-3 rounded-md  bg-transparent py-1 text-base shadow-xs w-48"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-[#000000]"
                >
                  <path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 0 0 1.88-2.37c-.83.5-1.75.87-2.72 1.07A4.28 4.28 0 0 0 12 9.03c0 .34.04.67.1.99C8.09 9.86 4.84 8.13 2.67 5.44c-.37.64-.58 1.39-.58 2.19 0 1.51.77 2.85 1.94 3.63-.72-.02-1.4-.22-1.99-.55v.06c0 2.11 1.5 3.87 3.5 4.27-.37.1-.76.16-1.16.16-.28 0-.55-.03-.81-.08.55 1.72 2.16 2.97 4.07 3a8.6 8.6 0 0 1-5.32 1.84c-.35 0-.7-.02-1.04-.06A12.13 12.13 0 0 0 8.29 21c7.55 0 11.69-6.26 11.69-11.69 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 24 4.59a8.36 8.36 0 0 1-2.54.7z" />
                </svg>
                Twitter
              </Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/username"
                value={socialLinks.twitter || ""}
                onChange={(e) =>
                  handleSocialLinkChange("twitter", e.target.value)
                }
              />
            </div>

            {/* LinkedIn */}
            <div className=" flex items-center gap-2">
              <Label
                htmlFor="linkedin"
                className="flex items-center gap-2 border h-9  px-3 rounded-md  bg-transparent py-1 text-base shadow-xs w-48"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-[#000000]"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/username"
                value={socialLinks.linkedin || ""}
                onChange={(e) =>
                  handleSocialLinkChange("linkedin", e.target.value)
                }
              />
            </div>

            {/* GitHub */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="github"
                className="flex items-center gap-2 border h-9  px-3 rounded-md  bg-transparent py-1 text-base shadow-xs w-48"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-[#000000]"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Label>
              <Input
                id="github"
                placeholder="https://github.com/username"
                value={socialLinks.github || ""}
                onChange={(e) =>
                  handleSocialLinkChange("github", e.target.value)
                }
              />
            </div>

            {/* Dribbble */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="dribbble"
                className="flex items-center gap-2 border h-9  px-3 rounded-md  bg-transparent py-1 text-base shadow-xs w-48"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-[#000000]"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm9.568 5.302c.26.646.422 1.332.422 2.058 0 .337-.034.665-.092.987-.31-.092-.678-.17-1.097-.232-1.448-.211-3.126-.211-4.574 0-.421.062-.787.14-1.097.232-.058-.322-.092-.65-.092-.987 0-.726.162-1.412.422-2.058C7.835 3.827 9.783 2.5 12 2.5s4.165 1.327 5.568 2.802z" />
                </svg>
                Dribbble
              </Label>
              <Input
                id="dribbble"
                placeholder="https://dribbble.com/username"
                value={socialLinks.dribbble || ""}
                onChange={(e) =>
                  handleSocialLinkChange("dribbble", e.target.value)
                }
              />
            </div>

            {/* Instagram */}
            <div className=" flex items-center gap-2">
              <Label
                htmlFor="instagram"
                className="flex items-center gap-2 border h-9  px-3 rounded-md  bg-transparent py-1 text-base shadow-xs w-48"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-[#000000]"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Instagram
              </Label>
              <Input
                id="instagram"
                placeholder="https://instagram.com/username"
                value={socialLinks.instagram || ""}
                onChange={(e) =>
                  handleSocialLinkChange("instagram", e.target.value)
                }
              />
            </div>

            {/* Behance */}
            <div className=" flex items-center gap-2">
              <Label
                htmlFor="behance"
                className="flex items-center gap-2 border h-9  px-3 rounded-md  bg-transparent py-1 text-base shadow-xs w-48"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="text-[#000000]"
                >
                  <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 2-5.101 2-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
                </svg>
                Behance
              </Label>
              <Input
                id="behance"
                placeholder="https://behance.net/username"
                value={socialLinks.behance || ""}
                onChange={(e) =>
                  handleSocialLinkChange("behance", e.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-3 w-full">
              <Button
                onClick={saveSocialLinks}
                disabled={isSavingSocialLinks}
                className="flex-1"
              >
                {isSavingSocialLinks ? "Saving..." : "Save Links"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpenModal(null)}
                disabled={isSavingSocialLinks}
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experience Modal */}
      <Dialog
        open={openModal === "experience"}
        onOpenChange={() => {
          setOpenModal(null);
          setEditingExperience(null);
          // State clearing is now handled by useEffect
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingExperience
                ? "Edit Work Experience"
                : "Add Work Experience"}
            </DialogTitle>
            {/* REMOVED DialogDescription */}
          </DialogHeader>
          <form
            onSubmit={
              editingExperience
                ? (e) => handleUpdateExperience(e, editingExperience._id)
                : handleAddExperience
            }
          >
            {/* This is the responsive layout you wanted to keep */}
            <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-4">
              {/* First row: Job Title and Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={expForm.jobTitle}
                    onChange={(e) =>
                      setExpForm((prev) => ({
                        ...prev,
                        jobTitle: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={expForm.company}
                    onChange={(e) =>
                      setExpForm((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Introduction textarea */}
              <div className="grid gap-2">
                <Label htmlFor="introduction">Introduction/Description</Label>
                <Textarea
                  id="introduction"
                  name="introduction"
                  value={expForm.introduction}
                  onChange={(e) =>
                    setExpForm((prev) => ({
                      ...prev,
                      introduction: e.target.value,
                    }))
                  }
                  placeholder="Describe your role, responsibilities, and achievements..."
                  rows={3}
                />
              </div>

              {/* Second row: Start Date with Month and Year dropdowns */}
              <div>
                <Label className="block mb-2">Start Date</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    value={expForm.startMonth}
                    onValueChange={(value) =>
                      setExpForm((prev) => ({ ...prev, startMonth: value }))
                    }
                  >
                    {/* CHANGED: Added w-full */}
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={expForm.startYear}
                    onValueChange={(value) =>
                      setExpForm((prev) => ({ ...prev, startYear: value }))
                    }
                  >
                    {/* CHANGED: Added w-full */}
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="max-h-64 overflow-y-auto">
                        {yearOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Third row: Currently Working checkbox */}
              <div className="mb-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="currentlyWorking"
                    name="currentlyWorking"
                    checked={currentlyWorking}
                    onChange={handleCurrentlyWorkingChange}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label
                    htmlFor="currentlyWorking"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I am currently working in this role
                  </Label>
                </div>
              </div>

              {/* Fourth row: End Date with Month and Year dropdowns - Hidden when currently working */}
              {!currentlyWorking && (
                <div>
                  <Label className="block mb-2">End Date</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      value={expForm.endMonth}
                      onValueChange={(value) =>
                        setExpForm((prev) => ({ ...prev, endMonth: value }))
                      }
                    >
                      {/* CHANGED: Added w-full */}
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={expForm.endYear}
                      onValueChange={(value) =>
                        setExpForm((prev) => ({ ...prev, endYear: value }))
                      }
                    >
                      {/* CHANGED: Added w-full */}
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="max-h-64 overflow-y-auto">
                          {yearOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Fifth row: Employment Type and Location Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select
                    value={expForm.employmentType}
                    onValueChange={(value) =>
                      setExpForm((prev) => ({ ...prev, employmentType: value }))
                    }
                  >
                    {/* CHANGED: Added w-full */}
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="locationMode">Location Mode</Label>
                  <Select
                    value={expForm.locationMode}
                    onValueChange={(value) =>
                      setExpForm((prev) => ({ ...prev, locationMode: value }))
                    }
                  >
                    {/* CHANGED: Added w-full */}
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationModeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sixth row: Country and City dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={expForm.country}
                    onValueChange={(value) => {
                      setExpForm((prev) => ({
                        ...prev,
                        country: value,
                        city: "", // Reset city when country changes
                      }));
                    }}
                  >
                    {/* CHANGED: Added w-full */}
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="max-h-64 overflow-y-auto">
                        {countryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Select
                    value={expForm.city}
                    onValueChange={(value) =>
                      setExpForm((prev) => ({ ...prev, city: value }))
                    }
                    disabled={!expForm.country} // Disable if no country
                  >
                    {/* CHANGED: Added w-full */}
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="max-h-64 overflow-y-auto">
                        {cityOptions.length > 0 ? (
                          cityOptions.map((option) => (
                            // Use the new uniqueKey for the key prop
                            <SelectItem
                              key={option.uniqueKey}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            Select a country first
                          </SelectItem>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex w-full justify-start">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Education Modal */}
      <Dialog
        open={openModal === "education"}
        onOpenChange={() => {
          setOpenModal(null);
          setEditingEducation(null);
          // State clearing is now handled by useEffect
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingEducation ? "Edit Education" : "Add Education"}
            </DialogTitle>
            {/* REMOVED DialogDescription */}
          </DialogHeader>
          <form
            onSubmit={
              editingEducation
                ? (e) => handleUpdateEducation(e, editingEducation._id)
                : handleAddEducation
            }
          >
            <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-4">
              {/* First row: Institution and Degree */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="institution">School/University</Label>
                  <Input
                    id="institution"
                    name="institution"
                    value={eduForm.institution}
                    onChange={(e) =>
                      setEduForm((prev) => ({
                        ...prev,
                        institution: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="degree">Degree</Label>
                  <Input
                    id="degree"
                    name="degree"
                    value={eduForm.degree}
                    onChange={(e) =>
                      setEduForm((prev) => ({
                        ...prev,
                        degree: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Second row: Start Date with Month and Year dropdowns */}
              <div>
                <Label className="block mb-2">Start Date</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    value={eduForm.startMonth}
                    onValueChange={(value) =>
                      setEduForm((prev) => ({ ...prev, startMonth: value }))
                    }
                  >
                    {/* CHANGED: Added w-full */}
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={eduForm.startYear}
                    onValueChange={(value) =>
                      setEduForm((prev) => ({ ...prev, startYear: value }))
                    }
                  >
                    {/* CHANGED: Added w-full */}
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="max-h-64 overflow-y-auto">
                        {yearOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Third row: Currently Studying checkbox */}
              <div className="mb-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="currentlyStudying"
                    name="currentlyStudying"
                    checked={currentlyStudying}
                    onChange={(e) => setCurrentlyStudying(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label
                    htmlFor="currentlyStudying"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I am currently studying
                  </Label>
                </div>
              </div>

              {/* Fourth row: End Date with Month and Year dropdowns - Hidden when currently studying */}
              {!currentlyStudying && (
                <div>
                  <Label className="block mb-2">End Date</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      value={eduForm.endMonth}
                      onValueChange={(value) =>
                        setEduForm((prev) => ({ ...prev, endMonth: value }))
                      }
                    >
                      {/* CHANGED: Added w-full */}
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={eduForm.endYear}
                      onValueChange={(value) =>
                        setEduForm((prev) => ({ ...prev, endYear: value }))
                      }
                    >
                      {/* CHANGED: Added w-full */}
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="max-h-64 overflow-y-auto">
                          {yearOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <div className="flex w-full justify-start">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Skills Modal (No changes) */}
      <Dialog
        open={openModal === "skill"}
        onOpenChange={() => {
          setOpenModal(null);
          setEditingSkill(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingSkill ? "Edit Skill" : "Add Skill"}
            </DialogTitle>
            {/* REMOVED DialogDescription */}
          </DialogHeader>
          <form
            onSubmit={
              editingSkill
                ? (e) => handleUpdateSkill(e, editingSkill._id)
                : handleAddSkill
            }
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Skill Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g. Frontend, Design, Backend"
                  defaultValue={editingSkill?.category || ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Skill Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. React, Angular, Next.js"
                  defaultValue={editingSkill?.name || ""}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <div className="flex w-full justify-start">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AboutMeTab;
