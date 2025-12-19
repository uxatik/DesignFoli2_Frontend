"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getFullUrl } from "@/lib/utils";
import { UserInfo } from "../../../types/general";

const Banner = ({
  userInfo,
  publicProfile,
}: {
  userInfo: UserInfo | null;
  publicProfile: boolean;
}) => {
  const router = useRouter();

  // Navigation handler for Upload Resume button
  const handleEditProfile = () => {
    router.push("/editprofile");
  };

  // Get the full resume URL
  const resumeUrl = getFullUrl(userInfo?.resumeURL || "");

  return (
    <div className="pt-15 sm:pt-0 relative flex min-h-screen flex-col items-center justify-center bg-[url('/assets/images/headerImage.png')] bg-cover bg-center mb-5 sm:mb-0">
      {/* Gradient and blur overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/100  to-white/30 backdrop-blur-xl w-full h-full" />
      <div className="relative container mx-auto">
        <div className="flex flex-col items-center justify-center">
          <Image
            src={
              getFullUrl(userInfo?.firebasePhotoURL || "") ||
              "/assets/images/user.png"
            }
            alt="Profile Image"
            width={256}
            height={256}
            className="h-20 w-20 sm:h-30 sm:w-30 rounded-full object-cover"
          />

          <div className="text-center text-[#1A1A1A] font-[350] mt-2 sm:mt-4">
            <h1 className=" text-xl sm:text-5xl">
              I&#39;m{" "}
              <span className="bg-gradient-to-r from-[#0080FF] to-[#333399] bg-clip-text text-transparent font-medium">
                {userInfo?.profile.displayName}
              </span>
            </h1>
            <h1 className="text-xl sm:text-5xl  sm:mt-3">
              {userInfo?.professionalInfo?.title}
            </h1>
            <h2 className="text-xl sm:text-5xl sm:mt-3">
              @{userInfo?.professionalInfo?.companyName}
            </h2>
            <p className="text-lg mt-1 sm:mt-5 max-w-2xl sm:max-w-2xl text-[#4D4D4D] mx-auto pb-4 sm:pb-7">
              {userInfo?.professionalInfo?.introduction}
            </p>

            <div className="flex gap-4 justify-center mt-4">
              {resumeUrl ? (
                // SCENARIO 1 & 3: Resume exists (Show Download for both User and Public)
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-[#1A1A1A] text-white rounded-full hover:from-[#39328f] hover:to-[#6155F5] hover:opacity-90 transition-all duration-300 cursor-pointer"
                >
                  Download Resume
                </a>
              ) : (
                // SCENARIO 2 & 4: No Resume exists
                !publicProfile && (
                  // If logged in user (not public), show Upload button
                  <button
                    onClick={handleEditProfile}
                    className="px-6 py-2 bg-[#1A1A1A] text-white rounded-full hover:from-[#39328f] hover:to-[#6155F5] hover:opacity-90 transition-all duration-300 cursor-pointer"
                  >
                    Upload Resume
                  </button>
                )
                // If public profile and no resume, show nothing (null)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
