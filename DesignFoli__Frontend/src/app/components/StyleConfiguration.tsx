"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";

interface StyleConfig {
  font: "Serif" | "Sans Serif" | "Monospace" | "Cursive";
  headingStyle: "Regular" | "Bold" | "Semi-Bold" | "Light";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  buttonStyle: "Fill" | "Stroke";
  spacing: "S" | "M" | "L" | "XL";
}

const defaultStyle: StyleConfig = {
  font: "Sans Serif",
  headingStyle: "Regular",
  colors: {
    primary: "#1a1a1a",
    secondary: "#6c757d",
    accent: "#6155F5",
    background: "#F8F9FA",
  },
  buttonStyle: "Fill",
  spacing: "M",
};

const StyleConfiguration: React.FC = () => {
  const { state } = useAuth();
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(defaultStyle);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current style configuration
  const fetchStyleConfig = async () => {
    if (!state.token) {
      setError("Authentication token not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.style) {
        setStyleConfig(result.data.style);
      } else {
        throw new Error(result.error || "Failed to fetch style configuration");
      }
    } catch (error) {
      console.error("Error fetching style config:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch style configuration"
      );
      // Use default configuration on error
      setStyleConfig(defaultStyle);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.token) {
      fetchStyleConfig();
    }
  }, [state.token]);

  // Handle color change
  const handleColorChange = (
    colorType: keyof StyleConfig["colors"],
    value: string
  ) => {
    setStyleConfig((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorType]: value,
      },
    }));
  };

  // Handle non-color field changes
  const handleFieldChange = (
    field: keyof Omit<StyleConfig, "colors">,
    value: string
  ) => {
    setStyleConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save style configuration
  const handleSaveChanges = async () => {
    if (!state.token) {
      setError("Authentication token not available");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile/style`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(styleConfig),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update style configuration");
      }

      showToast.success("Style configuration saved successfully!");
    } catch (error) {
      console.error("Error saving style config:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save style configuration"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    setStyleConfig(defaultStyle);
  };

  // Get font family CSS value
  const getFontFamily = (font: string) => {
    switch (font) {
      case "Serif":
        return "serif";
      case "Sans Serif":
        return "sans-serif";
      case "Monospace":
        return "monospace";
      case "Cursive":
        return "cursive";
      default:
        return "sans-serif";
    }
  };

  // Get heading font weight
  const getHeadingWeight = (style: string) => {
    switch (style) {
      case "Light":
        return "300";
      case "Regular":
        return "400";
      case "Semi-Bold":
        return "600";
      case "Bold":
        return "700";
      default:
        return "400";
    }
  };

  // Get spacing value
  const getSpacingValue = (spacing: string) => {
    switch (spacing) {
      case "S":
        return "0.5rem";
      case "M":
        return "1rem";
      case "L":
        return "1.5rem";
      case "XL":
        return "2rem";
      default:
        return "1rem";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3">Loading style configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Style Configuration</h2>
        <p className="text-gray-600">
          Customize the appearance of your profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Controls */}
        <div className="space-y-6">
          {/* Font Selection */}
          <div className="space-y-2">
            <Label htmlFor="font">Font Family</Label>
            <Select
              value={styleConfig.font}
              onValueChange={(value) =>
                handleFieldChange("font", value as StyleConfig["font"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sans Serif">Sans Serif</SelectItem>
                <SelectItem value="Serif">Serif</SelectItem>
                <SelectItem value="Monospace">Monospace</SelectItem>
                <SelectItem value="Cursive">Cursive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Heading Style */}
          <div className="space-y-2">
            <Label htmlFor="headingStyle">Heading Style</Label>
            <Select
              value={styleConfig.headingStyle}
              onValueChange={(value) =>
                handleFieldChange(
                  "headingStyle",
                  value as StyleConfig["headingStyle"]
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select heading style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Light">Light</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Semi-Bold">Semi-Bold</SelectItem>
                <SelectItem value="Bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Button Style */}
          <div className="space-y-2">
            <Label htmlFor="buttonStyle">Button Style</Label>
            <Select
              value={styleConfig.buttonStyle}
              onValueChange={(value) =>
                handleFieldChange(
                  "buttonStyle",
                  value as StyleConfig["buttonStyle"]
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select button style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fill">Fill</SelectItem>
                <SelectItem value="Stroke">Stroke</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spacing */}
          <div className="space-y-2">
            <Label htmlFor="spacing">Spacing</Label>
            <Select
              value={styleConfig.spacing}
              onValueChange={(value) =>
                handleFieldChange("spacing", value as StyleConfig["spacing"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select spacing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">Small</SelectItem>
                <SelectItem value="M">Medium</SelectItem>
                <SelectItem value="L">Large</SelectItem>
                <SelectItem value="XL">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Colors</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary"> Color</Label>
                <div className="flex items-center ">
                  <input
                    type="color"
                    id="primary"
                    value={styleConfig.colors.primary}
                    onChange={(e) =>
                      handleColorChange("primary", e.target.value)
                    }
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styleConfig.colors.primary}
                    onChange={(e) =>
                      handleColorChange("primary", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#1a1a1a"
                  />
                </div>
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="secondary">Secondary Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="secondary"
                    value={styleConfig.colors.secondary}
                    onChange={(e) =>
                      handleColorChange("secondary", e.target.value)
                    }
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styleConfig.colors.secondary}
                    onChange={(e) =>
                      handleColorChange("secondary", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#6c757d"
                  />
                </div>
              </div> */}

              {/* <div className="space-y-2">
                <Label htmlFor="accent">Accent Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="accent"
                    value={styleConfig.colors.accent}
                    onChange={(e) =>
                      handleColorChange("accent", e.target.value)
                    }
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styleConfig.colors.accent}
                    onChange={(e) =>
                      handleColorChange("accent", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#6155F5"
                  />
                </div>
              </div> */}

              {/* <div className="space-y-2">
                <Label htmlFor="background">Background Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="background"
                    value={styleConfig.colors.background}
                    onChange={(e) =>
                      handleColorChange("background", e.target.value)
                    }
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styleConfig.colors.background}
                    onChange={(e) =>
                      handleColorChange("background", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#F8F9FA"
                  />
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Preview</h3>
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: styleConfig.colors.background,
              fontFamily: getFontFamily(styleConfig.font),
              padding: getSpacingValue(styleConfig.spacing),
            }}
          >
            <h1
              style={{
                color: styleConfig.colors.primary,
                fontWeight: getHeadingWeight(styleConfig.headingStyle),
                marginBottom: getSpacingValue(styleConfig.spacing),
              }}
              className="text-2xl"
            >
              Sample Heading
            </h1>
            <p
              style={{
                color: styleConfig.colors.secondary,
                marginBottom: getSpacingValue(styleConfig.spacing),
              }}
            >
              This is a sample paragraph to demonstrate how your text will look
              with the selected styling options.
            </p>
            <div className="flex space-x-4">
              <button
                style={{
                  backgroundColor:
                    styleConfig.buttonStyle === "Fill"
                      ? styleConfig.colors.accent
                      : "transparent",
                  color:
                    styleConfig.buttonStyle === "Fill"
                      ? "white"
                      : styleConfig.colors.accent,
                  border: `2px solid ${styleConfig.colors.accent}`,
                  padding: `calc(${getSpacingValue(
                    styleConfig.spacing
                  )} * 0.5) ${getSpacingValue(styleConfig.spacing)}`,
                }}
                className="rounded-md font-medium transition-colors"
              >
                Sample Button
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
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
              className="text-red-500 mr-3"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={handleReset} disabled={isSaving}>
          Reset to Default
        </Button>

        <div className="space-x-4">
          <Button
            variant="default"
            className="bg-[#1a1a1a] hover:bg-[#39328f] text-white"
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
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
      </div>
    </div>
  );
};

export default StyleConfiguration;
