"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CreateCaseStudyRedirectPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dynamic route with id=0 for creating new case studies
    router.replace("/case-study/0");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6155F5]"></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default CreateCaseStudyRedirectPage;
