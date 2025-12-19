"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Banner from "../components/Banner";
import WorkTab from "../components/WorkTab";
import AboutMeTab from "../components/AboutMeTab";
import { UserInfo } from "../../../types/general";

const UserPage = () => {
//   console.log("Params:", params);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    setUser({
      _id: "user-123",
      firebaseUid: "firebase-uid-123",
      email: "rokon@example.com",
      username: "Rokon Zaman",
      authProvider: ["email"],
      firebasePhotoURL: "https://i.imgur.com/vwOnIr5.png",
      emailVerified: true,
      profile: {
        displayName: "Rokon Zaman",
        bio: "Product Designer with 7 years of experience",
        experience: [],
        education: [],
        skills: [],
        caseStudies: [],
      },
      professionalInfo: {
        title: "A Product Designer",
        companyName: "TallyKhata",
        introduction: "Product Designer with 7 years of experience crafting data-informed scalable experiences accross Healthcare, Maritime and Fintech.",
      },
      role: "user",
      verified: true,
      lastLogin: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resumeURL: "",
    });
  }, []);

  return (
    <>
      <Banner userInfo={user} publicProfile={true} />

      {/* tabs design start */}
      <div className="flex flex-col  w-full items-center">
        <div className="w-full container mx-auto px-4">
          {" "}
          <Tabs defaultValue="work" className="w-full mb-10">
            <div className=" w-full">
              <TabsList className="flex gap-4 bg-transparent border-none">
                <TabsTrigger
                  value="work"
                  className="px-6 py-2 rounded-5xl font-semibold transition-all bg-white shadow data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white data-[state=active]:border-black data-[state=active]:border-2 rounded-full "
                >
                  Work
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="px-6 py-2 rounded-5xl font-semibold transition-all bg-white shadow data-[state=active]:bg-[#1A1A1A]  data-[state=active]:text-white data-[state=active]:border-black data-[state=active]:border-2 rounded-full"
                >
                  About Me
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="w-full flex justify-center mb-4">
              <div className="h-0.25 w-full bg-gray-200 rounded-5xl" />
            </div>
            <TabsContent value="work">
              <WorkTab publicProfile={true} />
            </TabsContent>
            <TabsContent value="about">
              <AboutMeTab publicProfile={true} userInfo={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* tabs design start */}
    </>
  );
};

export default UserPage;
