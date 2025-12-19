"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import FileUploadCard from "@/app/components/FileUploadCard";
import {
  DynamicCaseStudyData,
  Section,
  SelectedField,
  FieldOption,
} from "../../../types/sections";
import { getFullUrl } from "@/lib/utils";

interface CaseStudyStep1Props {
  initialData: DynamicCaseStudyData;
  sections: Section[];
  availableTags: string[];
  onComplete: (data: Partial<DynamicCaseStudyData>) => void;
}

const CaseStudyStep1: React.FC<CaseStudyStep1Props> = ({
  initialData,
  sections,
  availableTags,
  onComplete,
}) => {
  const [formData, setFormData] = useState({
    projectTitle: initialData.projectTitle,
    thumbnailImage: initialData.thumbnailImage,
    tags: initialData.tags,
  });

  const [selectedFields, setSelectedFields] = useState<SelectedField[]>(
    initialData.selectedFields || []
  );

  const [tagSearchQuery, setTagSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    setFormData({
      projectTitle: initialData.projectTitle,
      thumbnailImage: initialData.thumbnailImage,
      tags: initialData.tags,
    });
    setSelectedFields(initialData.selectedFields || []);
  }, [initialData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        const dropdown = document.getElementById("tag-dropdown");
        if (dropdown) {
          dropdown.classList.add("hidden");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFieldToggle = (section: Section, field: FieldOption) => {
    const fieldId = field._id;
    const isSelected = selectedFields.some((f) => f.fieldId === fieldId);

    if (isSelected) {
      // Remove field
      setSelectedFields(selectedFields.filter((f) => f.fieldId !== fieldId));
    } else {
      // Add field
      setSelectedFields([
        ...selectedFields,
        {
          fieldId: field._id,
          fieldName: field.name,
          fieldLabel: field.label,
          fieldType: field.type,
          sectionId: section._id,
          sectionName: section.section,
          required: field.required,
          order: field.order,
          selected: true,
        },
      ]);
    }
  };

  const handleNext = () => {
    // Validate required fields
    if (!formData.projectTitle.trim()) {
      alert("Please enter a project title");
      return;
    }

    // Include selected fields in the data
    onComplete({
      ...formData,
      selectedFields,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="space-y-6">
        {/* Project Title */}
        <div className="space-y-2">
          <Label htmlFor="projectTitle">
            Project Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectTitle"
            name="projectTitle"
            value={formData.projectTitle}
            onChange={handleInputChange}
            placeholder="Enter your project title"
            className="w-full"
          />
        </div>

        {/* Thumbnail Image */}
        <div className="space-y-2">
          <Label htmlFor="thumbnailImage">Thumbnail Image</Label>

          {/* Display existing thumbnail image if it exists */}
          {formData.thumbnailImage &&
            typeof formData.thumbnailImage === "string" && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Current thumbnail image:
                </p>
                <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={getFullUrl(formData.thumbnailImage)}
                    alt="Current thumbnail"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

          <FileUploadCard
            onFileSelect={(file) =>
              setFormData({ ...formData, thumbnailImage: file })
            }
            acceptedFileTypes="image/*"
            title="Drag and drop your thumbnail image"
            description="to upload (optional)"
            maxSizeMB={2}
          />
          <p className="text-xs text-gray-500">
            Recommended size: 400x300px (Max 2MB) - Used for previews and
            thumbnails
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="relative" ref={dropdownRef}>
            <div
              className="min-h-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white cursor-pointer flex flex-wrap gap-2 items-center"
              onClick={() =>
                document
                  .getElementById("tag-dropdown")
                  ?.classList.toggle("hidden")
              }
            >
              {formData.tags.length === 0 ? (
                <span className="text-gray-500">Select tags...</span>
              ) : (
                formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#6155F5] text-white rounded text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({
                          ...formData,
                          tags: formData.tags.filter((t) => t !== tag),
                        });
                      }}
                      className="hover:text-gray-200 ml-1"
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
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </span>
                ))
              )}
              <svg
                className="w-4 h-4 ml-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div
              id="tag-dropdown"
              className="hidden absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {/* Search Input */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                <Input
                  type="text"
                  placeholder="Search tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-sm"
                />
              </div>
              
              {/* Filtered Tags List */}
              {availableTags
                .filter((tag) =>
                  tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
                )
                .map((tag) => (
                <div
                  key={tag}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    if (!formData.tags.includes(tag)) {
                      setFormData({
                        ...formData,
                        tags: [...formData.tags, tag],
                      });
                    }
                    document
                      .getElementById("tag-dropdown")
                      ?.classList.add("hidden");
                  }}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag)}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#6155F5] border-gray-300 rounded focus:ring-[#6155F5] mr-2"
                      readOnly
                    />
                    {tag}
                  </div>
                </div>
              ))}
              {availableTags.filter((tag) =>
                  tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
                ).length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  {tagSearchQuery ? "No matching tags found" : "No tags available"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-2">
          <Label>Fields</Label>
          <p className="text-sm text-gray-600">
            Select the individual fields you want to include in your case study
          </p>
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section._id} className="space-y-3">
                <div className="font-medium text-gray-900 border-b pb-2">
                  {section.section}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {section.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => {
                      const isSelected = selectedFields.some(
                        (f) => f.fieldId === field._id
                      );
                      return (
                        <div
                          key={field._id}
                          onClick={() => handleFieldToggle(section, field)}
                          className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={`field-${field._id}`}
                            checked={isSelected}
                            onChange={() => handleFieldToggle(section, field)}
                            onClick={(e) => e.stopPropagation()} // prevent double toggle
                            className="w-4 h-4 text-[#6155F5] border-gray-300 rounded focus:ring-[#6155F5]"
                          />

                          <label
                            htmlFor={`field-${field._id}`}
                            className="text-sm text-gray-900 cursor-pointer"
                          >
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleNext}
            className="bg-[#6155F5] hover:bg-[#4942d6] text-white px-8"
          >
            Next Step →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyStep1;
