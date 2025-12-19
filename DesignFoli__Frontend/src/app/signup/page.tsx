"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signInWithPopup, UserCredential } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { showToast } from "@/lib/toast";

const FcGoogle = dynamic(
  () => import("react-icons/fc").then((mod) => mod.FcGoogle),
  { ssr: false }
);
const MdOutlineEmail = dynamic(
  () => import("react-icons/md").then((mod) => mod.MdOutlineEmail),
  { ssr: false }
);
const FaArrowRightLong = dynamic(
  () => import("react-icons/fa6").then((mod) => mod.FaArrowRightLong),
  { ssr: false }
);

const SignUpPage: React.FC = () => {
  const router = useRouter();

  const handleGoogleSignup = async (): Promise<void> => {
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("✅ Google Sign-Up Success:", user);

      localStorage.setItem(
        "googleUser",
        JSON.stringify({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          accessToken: await user.getIdToken(),
        })
      );

      router.push("/");
    } catch (error) {
      // console.error("❌ Google Sign-Up Error:", error);
      showToast.error("Google Sign-up failed. Please try again.");
    }
  };

  return (
    <div className="bg-gradient-to-t from-white/60 via-blue-400/60 to-purple-300/60 backdrop-blur-lg flex min-h-screen flex-col items-center justify-center px-4">
      <div className="bg-white p-8 sm:p-10 rounded-lg shadow-lg w-full  max-w-md sm:max-w-lg">
        <h2 className="text-3xl sm:text-5xl py-2 font-bold text-center bg-gradient-to-r from-[#6155F5] to-[#39328f] bg-clip-text text-transparent mb-3 sm:mb-8">
          DesignFoli
        </h2>
        <h2 className="text-xl sm:text-3xl font-semibold mb-6 text-center">
          Sign up
        </h2>

        <div className="flex flex-col items-center gap-3 mb-5">
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 w-full sm:w-3/5 rounded-full border py-3 sm:py-5 px-3 sm:px-4 text-sm sm:text-base"
            onClick={handleGoogleSignup}
          >
            <span className="flex-none">
              <FcGoogle />
            </span>
            <span className="truncate">Sign up with Google</span>
          </Button>

          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 w-full sm:w-3/5 rounded-full border py-3 sm:py-5 px-3 sm:px-4 text-sm sm:text-base"
            onClick={() => router.push("/signup/signupWithEmail")}
          >
            <span className="flex-none">
              <MdOutlineEmail />
            </span>
            <span className="truncate">Sign up with Email</span>
          </Button>
        </div>

        <div className="text-center text-sm text-gray-900">
          Already have an account?
        </div>
        <div
          onClick={() => router.push("/login")}
          className="flex items-center justify-center mt-2 gap-2 hover:cursor-pointer text-blue-700"
        >
          <span>Login</span>
          <FaArrowRightLong />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
