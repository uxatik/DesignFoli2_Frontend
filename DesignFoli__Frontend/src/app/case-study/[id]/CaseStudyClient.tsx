"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CaseStudyStep1 from "@/app/components/CaseStudyStep1";
import CaseStudyStep2 from "@/app/components/CaseStudyStep2";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";
import {
  Section,
  SelectedField,
  DynamicCaseStudyData,
  ConfigurationResponse,
} from "../../../../types/sections";

interface CaseStudyClientProps {
  caseStudyId: string;
}

export default function CaseStudyClient({ caseStudyId }: CaseStudyClientProps) {
  const { state } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isFetchingSections, setIsFetchingSections] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [caseStudyData, setCaseStudyData] = useState<DynamicCaseStudyData>({
    projectTitle: "",
    title: "",
    description: "",
    coverImage: null,
    thumbnailImage: null,
    clientName: "",
    projectDate: "",
    category: "",
    tags: [],
    selectedFields: [],
    isPrivate: false,
    fieldValues: {},
  });

  // Fetch sections on component mount
  useEffect(() => {
    fetchSections();
  }, []);

  // Check if we're in edit mode and fetch existing data
  useEffect(() => {
    if (caseStudyId && caseStudyId !== "0") {
      setIsEditMode(true);
      fetchCaseStudyData(caseStudyId);
    }
  }, [caseStudyId]);

  const fetchSections = async () => {
    if (!state.token) return;

    setIsFetchingSections(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/configuration`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ConfigurationResponse = await response.json();

      if (result.success && result.data) {
        setSections(result.data.sections);
        setAvailableTags(result.data.tags || []);
      } else {
        throw new Error(result.error || "Failed to fetch configuration");
      }
    } catch (error) {
      console.error("Error fetching configuration:", error);
      showToast.error(
        error instanceof Error ? error.message : "Failed to fetch configuration"
      );
    } finally {
      setIsFetchingSections(false);
    }
  };

  const fetchCaseStudyData = async (id: string) => {
    if (!state.token) {
      showToast.error("Authentication required");
      return;
    }

    setIsFetchingData(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/profile/casestudy/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        if (typeof result.data.fieldValues === "string")
          result.data.fieldValues = JSON.parse(result.data.fieldValues);
        const data = result.data;

        // Parse fieldValues if it's a string
        // const parsedFieldValues =
        //   typeof data.fieldValues === "string"
        //     ? JSON.parse(data.fieldValues)
        //     : data.fieldValues || {};

        setCaseStudyData(result.data as DynamicCaseStudyData);
      } else {
        throw new Error(result.error || "Failed to fetch case study");
      }
    } catch (error) {
      console.error("Error fetching case study:", error);
      showToast.error(
        error instanceof Error ? error.message : "Failed to fetch case study"
      );
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleStep1Complete = (step1Data: Partial<DynamicCaseStudyData>) => {
    setCaseStudyData({
      ...caseStudyData,
      ...step1Data,
    } as DynamicCaseStudyData);
    setCurrentStep(2);
  };

  const handleStep2Complete = async (
    step2Data: Partial<DynamicCaseStudyData>
  ) => {
    const finalData = {
      ...caseStudyData,
      ...step2Data,
    } as DynamicCaseStudyData;
    setCaseStudyData(finalData);

    // Submit case study
    await handleSubmit(finalData);
  };

  const handleSubmit = async (data: DynamicCaseStudyData) => {
    if (!state.token) {
      showToast.error("Authentication required");
      return;
    }

    setIsLoading(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      // Create FormData for file uploads
      const formData = new FormData();

      // Add projectTitle as main field
      formData.append("projectTitle", data.projectTitle);

      // Add isPrivate
      // Send "" for false/undefined to ensure backend treats it as falsy
      formData.append("isPrivate", data.isPrivate ? "true" : "");

      // Create values object for all other data
      const values = {
        tags: data.tags,
        selectedFields: data.selectedFields,
        fieldValues: data.fieldValues,
      };

      // Add values as JSON string
      formData.append("tags", JSON.stringify(data.tags));
      formData.append("selectedFields", JSON.stringify(data.selectedFields));
      formData.append("fieldValues", JSON.stringify(data.fieldValues));

      // Add cover image file if exists
      if (data.coverImage) {
        formData.append("coverImage", data.coverImage);
      }

      // Add thumbnail image file if exists
      if (data.thumbnailImage) {
        formData.append("thumbnailImage", data.thumbnailImage);
      }

      // Add dynamic field images if they exist in fieldValues
      Object.keys(data.fieldValues).forEach((fieldName) => {
        const fieldValue = data.fieldValues[fieldName];
        if (Array.isArray(fieldValue)) {
          // This is likely an array of files
          fieldValue.forEach((file, index) => {
            if (file instanceof File) {
              formData.append(`${fieldName}[${index}]`, file);
            }
          });
        }
      });

      // Determine if we're creating or updating
      const isUpdate = isEditMode && caseStudyId && caseStudyId !== "0";
      const endpoint = isUpdate
        ? `${apiBaseUrl}/api/v1/users/profile/casestudy/${caseStudyId}`
        : `${apiBaseUrl}/api/v1/users/profile/addcasestudy`;
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${state.token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const successMessage = isUpdate
          ? "Case study updated successfully!"
          : "Case study created successfully!";
        showToast.success(successMessage);

        // Redirect to home page after successful submission
        setTimeout(() => {
          router.push("/");
        }, 1500); // Wait 1.5 seconds to show success message
      } else {
        throw new Error(
          result.error ||
          `Failed to ${isUpdate ? "update" : "create"} case study`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} case study:`,
        error
      );
      showToast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? "update" : "create"} case study`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pt-24 pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 relative">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="absolute left-0 top-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full text-[#1a1a1a] transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>

            {isFetchingData || isFetchingSections ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6155F5]"></div>
                <p className="mt-2 text-gray-600">
                  {isFetchingData
                    ? "Loading case study data..."
                    : "Loading sections..."}
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-2 text-center">
                  {isEditMode
                    ? currentStep === 1
                      ? "Edit Case Study - Step 1"
                      : "Edit Case Study - Step 2"
                    : currentStep === 1
                      ? "Create Case Study - Step 1"
                      : "Create Case Study - Step 2"}
                </h1>
                <p className="text-gray-600 text-center">
                  {isEditMode
                    ? currentStep === 1
                      ? "Update basic information about your project"
                      : "Modify detailed content and showcase your work"
                    : currentStep === 1
                      ? "Let's start with basic information about your project"
                      : "Add detailed content and showcase your work"}
                </p>
              </>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-medium ${currentStep >= 1 ? "text-[#6155F5]" : "text-gray-400"
                  }`}
              >
                Step 1: Basic Info
              </span>
              <span
                className={`text-sm font-medium ${currentStep >= 2 ? "text-[#6155F5]" : "text-gray-400"
                  }`}
              >
                Step 2: Details
              </span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-[#6155F5] transition-all duration-300 ease-in-out"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 ? (
            <CaseStudyStep1
              initialData={caseStudyData}
              sections={sections}
              availableTags={availableTags}
              onComplete={handleStep1Complete}
            />
          ) : (
            <CaseStudyStep2
              initialData={caseStudyData}
              onComplete={handleStep2Complete}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
