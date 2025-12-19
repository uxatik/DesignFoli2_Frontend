// ...existing code...

import Image from "next/image";
import SocialLinks from "./SocialLinks";
import { UserInfo } from "../../../types/general";

// import { User } from "lucide-react";

type FooterProps = {
  userInfo?: UserInfo | null;
  publicProfile?: boolean;
  onEditProfile?: () => void;
};

const getFullUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url;
};

const Footer = ({
  userInfo,
  publicProfile = false,
  onEditProfile,
}: FooterProps) => {


  const photoSrc =
    getFullUrl(userInfo?.firebasePhotoURL) || "/assets/images/user.png";
  const resumeUrl = getFullUrl(userInfo?.resumeURL || "");

  return (
    <div className="relative flex flex-col items-center justify-center bg-[url('/assets/images/footerImage.png')] bg-cover bg-center py-12">
      <div className="absolute inset-0 bg-gradient-to-b from-white/100  backdrop-blur-xl w-full h-full" />

      <div className="relative z-10 container mx-auto">
        <div className="flex flex-col items-center justify-center">
          <Image
            src={photoSrc}
            alt="Profile Image"
            width={100}
            height={100}
            className="h-15 w-15 rounded-full object-cover"
          />

          <div className="text-center text-[#1A1A1A] font-[350] mt-2">
            <h1 className="text-lg">
              <span className="bg-gradient-to-r from-[#25A1F4] to-[#332673] bg-clip-text text-transparent font-semibold">
                {userInfo?.profile?.displayName || "Designer"}
              </span>
            </h1>
            <h1 className="text-sm font-semibold text-gray-800">
              {userInfo?.professionalInfo?.title || ""} @
              {userInfo?.professionalInfo?.companyName || ""}
            </h1>
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      {userInfo?.profile?.socialLinks && (
        <div className="relative z-10 mt-6">
          <SocialLinks links={userInfo.profile.socialLinks} showLabels={false} />
        </div>
      )}
    </div>
  );
};

export default Footer;
