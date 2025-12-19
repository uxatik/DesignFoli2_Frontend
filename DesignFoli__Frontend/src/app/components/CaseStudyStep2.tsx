"use client";
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import FileUploadCard from "@/app/components/FileUploadCard";
import {
  DynamicCaseStudyData,
  FieldOption,
  SelectedField,
} from "../../../types/sections";
import Image from "next/image";
import { getFullUrl } from "@/lib/utils";

interface CaseStudyStep2Props {
  initialData: DynamicCaseStudyData;
  onComplete: (data: Partial<DynamicCaseStudyData>) => void;
  onBack: () => void;
  isLoading: boolean;
}

const CaseStudyStep2: React.FC<CaseStudyStep2Props> = ({
  initialData,
  onComplete,
  onBack,
  isLoading,
}) => {
  const [fieldValues, setFieldValues] = useState<
    Record<string, string | File | File[] | string[]>
  >(initialData.fieldValues || {});

  const [coverImage, setCoverImage] = useState<File | string | null>(
    initialData.coverImage || null
  );
  const [isPrivate, setIsPrivate] = useState<boolean>(
    initialData.isPrivate || false
  );

  // Update field values when initialData changes (for edit mode)
  React.useEffect(() => {
    setFieldValues(initialData.fieldValues || {});
    setCoverImage(initialData.coverImage || null);
    setIsPrivate(initialData.isPrivate || false);
  }, [initialData]);

  // Memoize cover image URL to prevent re-creation on every render
  const coverImageUrl = useMemo(() => {
    if (coverImage) {
      // If coverImage is a File object, create a URL
      if (coverImage instanceof File) {
        return URL.createObjectURL(coverImage);
      }
      // If it's a string URL (from API), return it directly
      if (typeof coverImage === "string") {
        return coverImage;
      }
    }
    return "";
  }, [coverImage]);

  const handleFieldChange = (
    fieldName: string,
    value: string | File | File[] | string[]
  ) => {
    setFieldValues({
      ...fieldValues,
      [fieldName]: value,
    });
  };

  const handleFileSelect = (fieldName: string, file: File | null) => {
    if (file) {
      handleFieldChange(fieldName, file);
    }
  };

  const handleMultiFileSelect = (fieldName: string, file: File | null) => {
    if (file) {
      const currentFiles = (fieldValues[fieldName] as File[]) || [];
      handleFieldChange(fieldName, [...currentFiles, file]);
    }
  };

  const removeFile = (fieldName: string, index: number) => {
    const currentFiles = (fieldValues[fieldName] as File[]) || [];
    const newFiles = currentFiles.filter((_, i) => i !== index);
    handleFieldChange(fieldName, newFiles);
  };

  const renderField = (field: FieldOption, sectionName: string) => {
    const fieldName = field.name;
    const value = fieldValues[fieldName] || "";

    switch (field.type) {
      case "text":
      case "textarea":
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.type === "textarea" ? (
              <Textarea
                id={fieldName}
                value={value as string}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                rows={4}
                className="resize-none"
              />
            ) : (
              <Input
                id={fieldName}
                value={value as string}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            <p className="text-xs text-gray-500">
              {field.label} for {sectionName}
            </p>
          </div>
        );

      case "picture":
        console.log("Rendering picture field:", fieldName, field, fieldValues);
        const currentFiles =
          (fieldValues[fieldName] as (File | string)[]) || [];
        console.log("Rendering picture currentFiles:", currentFiles);
        console.log("Rendering picture currentFiles:", initialData[fieldName]);
        return (
          <div key={fieldName} className="space-y-2">
            <Label>
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <FileUploadCard
              onFilesSelect={(files) => handleFieldChange(fieldName, files)}
              acceptedFileTypes="image/*"
              title={`Add ${field.label.toLowerCase()}`}
              description="click to upload multiple images"
              maxSizeMB={5}
              multiple={true}
              initialFiles={currentFiles.filter(
                (f): f is File => f instanceof File
              )}
            />
            <p className="text-xs text-gray-500">
              Upload multiple images for {sectionName} (Max 5MB each). You can
              upload several images.
            </p>

            {/* Display uploaded images */}
            <div className="space-y-2 mt-4">
              {/* <Label>Addition</Label> */}
              <Textarea
                value={(fieldValues[`${fieldName}_addition`] as string) || ""}
                onChange={(e) =>
                  handleFieldChange(`${fieldName}_addition`, e.target.value)
                }
                placeholder="Enter additional information"
                rows={2}
                className="resize-none"
              />
            </div>

            {currentFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {currentFiles.length} image
                    {currentFiles.length !== 1 ? "s" : ""} uploaded
                  </p>
                  <button
                    type="button"
                    onClick={() => handleFieldChange(fieldName, [])}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {currentFiles.map((file: File | string, index: number) => {
                    console.log("Rendering file:", file);
                    // Check if it's a File object by checking for File-specific properties
                    const isFileObject = file instanceof File;
                    const imageUrl = initialData[fieldName] as string[];

                    //console.log(initialData[fieldName][index]);
                    const imageName = isFileObject
                      ? file.name
                      : `Existing image ${index + 1}`;

                    // Don't render if imageUrl is empty or invalid
                    if (!imageUrl || typeof imageUrl === "string") {
                      return null;
                    }

                    return (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                          <Image
                            src={getFullUrl(imageUrl[index])}
                            alt={`${field.label} ${index + 1} ${imageUrl}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(fieldName, index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
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
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                          <p className="text-xs text-white truncate">
                            {imageName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    if (initialData.selectedFields.length === 0) {
      alert("Please select at least one field in step 1");
      return;
    }

    // Check if cover image is uploaded (required field)
    if (!coverImage) {
      alert("Please upload a cover image");
      return;
    }

    // Check if all required fields are filled
    for (const selectedField of initialData.selectedFields) {
      if (selectedField.required) {
        const value = fieldValues[selectedField.fieldName];
        if (
          !value ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === "string" && value.trim() === "")
        ) {
          alert(
            `Please fill in the required field: ${selectedField.fieldLabel}`
          );
          return;
        }
      }
    }

    onComplete({ fieldValues, coverImage, isPrivate });
  };

  // Group selected fields by section
  const groupedFields = initialData.selectedFields.reduce((acc, field) => {
    if (!acc[field.sectionId]) {
      acc[field.sectionId] = {
        sectionName: field.sectionName,
        fields: [],
      };
    }
    acc[field.sectionId].fields.push(field);
    return acc;
  }, {} as Record<string, { sectionName: string; fields: SelectedField[] }>);

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="space-y-8">
        {initialData.selectedFields.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No fields selected. Please go back and select fields to continue.
            </p>
            <Button onClick={onBack} variant="outline" className="mt-4">
              ← Go Back
            </Button>
          </div>
        ) : (
          <>
            {/* Cover Image Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cover Image
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a cover image for your case study
                </p>
              </div>

              <div className="space-y-6 pl-4 ">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">
                    Cover Image <span className="text-red-500">*</span>
                  </Label>
                  <FileUploadCard
                    onFileSelect={(file) => setCoverImage(file)}
                    acceptedFileTypes="image/*"
                    title="Drag and drop your cover image"
                    description="to upload"
                    maxSizeMB={5}
                  />
                  <p className="text-xs text-gray-500">
                    Recommended size: 1200x800px (Max 5MB) - This is the main
                    image for your case study
                  </p>

                  {/* Display uploaded cover image */}
                  {coverImage && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">
                        Cover image uploaded
                      </p>
                      <div className="relative group w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={getFullUrl(coverImageUrl)}
                          alt="Cover image"
                          fill
                          className="object-cover"
                          key={
                            typeof coverImage === "string"
                              ? coverImage
                              : coverImage.name
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setCoverImage(null)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove cover image"
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
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                          <p className="text-xs text-white truncate">
                            {typeof coverImage === "string"
                              ? "Existing image"
                              : coverImage.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {Object.entries(groupedFields).map(([sectionId, sectionData]) => (
              <div key={sectionId} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {sectionData.sectionName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Fill in the details for this section
                  </p>
                </div>

                <div className="space-y-6 pl-4 ">
                  {sectionData.fields
                    .sort((a, b) => a.order - b.order)
                    .map((selectedField) => {
                      // Create a FieldOption object for rendering
                      const fieldOption: FieldOption = {
                        _id: selectedField.fieldId,
                        name: selectedField.fieldName,
                        label: selectedField.fieldLabel,
                        type: selectedField.fieldType as
                          | "text"
                          | "textarea"
                          | "picture",
                        required: selectedField.required,
                        order: selectedField.order,
                        repeatable: false,
                        subFields: [],
                        options: [],
                      };
                      return renderField(fieldOption, sectionData.sectionName);
                    })}
                </div>
              </div>
            ))}

            {/* Private/Public Toggle */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox
                id="isPrivate"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="isPrivate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Make this case study Private
                </Label>
                <p className="text-sm text-muted-foreground text-gray-500">
                  Private case studies will not be shown on your public profile.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                onClick={onBack}
                variant="outline"
                className="px-8"
                disabled={isLoading}
              >
                ← Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-[#6155F5] hover:bg-[#4942d6] text-white px-8"
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
                  "Save Case Study"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CaseStudyStep2;
