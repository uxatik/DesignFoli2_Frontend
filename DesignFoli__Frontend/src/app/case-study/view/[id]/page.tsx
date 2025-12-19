"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import {
  DynamicCaseStudyData,
  Section,
  SelectedField,
} from "../../../../../types/sections";
import { getFullUrl } from "@/lib/utils";
import { string } from "zod";

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { state } = useAuth();
  const [caseStudyData, setCaseStudyData] =
    useState<DynamicCaseStudyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [caseStudyId, setCaseStudyId] = useState<string>("");

  useEffect(() => {
    const initializePage = async () => {
      const resolvedParams = await params;
      const { id } = resolvedParams;
      setCaseStudyId(id);

      if (id && id !== "0") {
        await Promise.all([fetchCaseStudyData(id), fetchSections()]);
      } else {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [params]);

  const fetchCaseStudyData = async (id: string) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/case-study/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // const result = await response.json();

      // console.log("Fetch case study response:", result);

      if (!response.ok) {
        if (response.status === 404) {
          // throw new Error("Case study not found");
          console.error("Case study not found");
        }
        // throw new Error(`HTTP error! status: ${response.status}`);
        console.error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        result.data.fieldValues = JSON.parse(result.data.fieldValues);
        setCaseStudyData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch case study");
      }
    } catch (error) {
      console.error("Error fetching case study:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const colClassMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };
  const fetchSections = async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/configuration`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setSections(result.data.sections);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const renderFieldValue = (
    fieldValue: string | File | File[] | string[],
    fieldType: string,
    fieldName: string
  ): React.ReactNode => {
    console.log("Rendering field:", fieldType, fieldValue);
    console.log("Rendering field:", fieldName);
    //console.log(caseStudyData[fieldName]);
    if (!fieldValue) return null;

    switch (fieldType) {
      case "picture":
        // Use the fieldValue parameter instead of accessing caseStudyData
        //const pictures = caseStudyData?[fieldName] as string[];
        //  c; //onst pictures = (caseStudyData?[fieldName] as (File | string)[]) || [];
        const pictures = caseStudyData![fieldName] as string[];
        const addition = caseStudyData?.fieldValues[
          `${fieldName}_addition`
        ] as string;

        if (Array.isArray(pictures)) {
          const gridCols =
            pictures.length > 6
              ? "grid-cols-6"
              : colClassMap[pictures.length] || "grid-cols-1";

          return (
            <div className="space-y-4">
              <div className={`grid ${gridCols} `}>
                {pictures.map((item: string, index: number) => (
                  <div
                    key={index}
                    className={`relative ${
                      pictures.length === 1 ? "h-[350px]" : "h-[200px]"
                    }  overflow-hidden`}
                  >
                    <Image
                      src={getFullUrl(item)}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              {addition && (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-[#1a1a1a]">
                    {addition}
                  </p>
                </div>
              )}
            </div>
          );
        }

        // If it's a single string (not an array)
        if (typeof pictures === "string") {
          return (
            <div className="space-y-4">
              <div className="relative h-[350px] rounded-lg overflow-hidden">
                <Image
                  src={getFullUrl(pictures)}
                  alt="Project image"
                  fill
                  className="object-cover"
                />
              </div>
              {addition && (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-[#1a1a1a]">
                    {addition}
                  </p>
                </div>
              )}
            </div>
          );
        }

        return null;
      case "textarea":
        return (
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-[#1a1a1a]">
              {fieldValue as string}
            </p>
          </div>
        );

      case "checkbox":
        if (Array.isArray(fieldValue)) {
          return (
            <div className="space-y-2">
              {fieldValue.map((value, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-4 h-4 rounded border-2 border-[#6155F5] bg-[#6155F5] mr-2 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-[#1a1a1a]">{String(value)}</span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="text-[#1a1a1a]">{String(fieldValue)}</span>;

      case "number":
        return (
          <span className="text-[#1a1a1a] font-medium">
            {String(fieldValue)}
          </span>
        );

      default:
        return <span className="text-[#1a1a1a]">{String(fieldValue)}</span>;
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pt-25 mb-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6155F5]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseStudyData) {
    return (
      <div>
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pt-25 mb-10">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-600 mb-4">
              Case Study Not Found
            </h1>
            <p className="text-gray-500 mb-8">
              The case study youre looking for doesnt exist or you dont have
              permission to view it.
            </p>
            <button
              onClick={() => router.back()}
              className="bg-[#6155F5] text-white px-6 py-2 rounded-lg hover:bg-[#5044e4] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pt-25 mb-10">
        {/* Title section with back button */}
        <div className="relative mt-6 mb-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full text-[#1a1a1a] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Centered title and tag */}
          <div className="text-center mx-auto">
            {/* Project Category */}
            <div className="">
              {caseStudyData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            {/* Project Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]">
              {caseStudyData.projectTitle}
            </h1>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => router.push(`/case-study/${caseStudyId}`)}
            className="absolute right-0 top-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-xs h-9 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-black"
          >
            <Pencil className="h-4 w-4" />
            Edit Case Study
          </button>
        </div>

        {/* Project Banner */}
        {caseStudyData.coverImage && (
          <div className="w-full h-[200px] md:h-[350px] relative rounded-xl overflow-hidden mb-12">
            {typeof caseStudyData.coverImage === "string" ? (
              <Image
                src={getFullUrl(caseStudyData.coverImage)}
                alt="Project Banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Cover Image</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Fields */}

        <div className="space-y-6">
          {caseStudyData.selectedFields.map((selectedField) => {
            const fieldValue =
              caseStudyData.fieldValues[selectedField.fieldName];

            return (
              <div key={selectedField.fieldId}>
                <h3 className="text-lg font-medium mb-3 text-[#1a1a1a]">
                  {selectedField.fieldLabel}
                </h3>
                <div>
                  {renderFieldValue(
                    fieldValue,
                    selectedField.fieldType,
                    selectedField.fieldName
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
