"use client";
import React from "react";
import StyleConfiguration from "@/app/components/StyleConfiguration";

const StyleSettingsPage = () => {
  return (
    <div>
      <div className="min-h-screen flex flex-col items-center pt-24 pb-5 px-4">
        <h1 className="text-3xl font-bold mb-8">Style Settings</h1>
        <StyleConfiguration />
      </div>
    </div>
  );
};

export default StyleSettingsPage;
