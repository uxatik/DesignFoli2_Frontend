"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import uploadImage from "@/assets/icons/upload.svg";

const AddWorkCard = () => {
  const router = useRouter();

  const handleCreateCaseStudy = () => {
    router.push("/case-study/0");
  };

  return (
    <div
      onClick={handleCreateCaseStudy} // ✅ Moved click event to the main container
      className="border-dashed border-2 w-72 h-60 border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition group" // Added 'group' for better hover states if needed
    >
      <Image
        src={uploadImage}
        alt="Upload"
        width={70}
        height={70}
        className="mb-3"
      />
      <p className="text-[#1A1A1A] text-xl font-semibold text-center mb-2">
        Create Case Study
      </p>
      <p className="text-[#4D4D4D] text-xs text-center mb-4">
        Show off your best work. Get feedback, likes and be a part of a growing
        community
      </p>


      <div className="bg-[#1A1A1A] text-white px-6 py-2 rounded-full font-medium group-hover:bg-[#39328f] transition">
        Create
      </div>
    </div>
  );
};

export default AddWorkCard;
