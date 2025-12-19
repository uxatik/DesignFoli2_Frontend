// ...existing code...
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
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

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, loginWithGoogle, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    clearError();

    try {
      console.log("Attempting Firebase login with:", { email, password });

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("Firebase login successful:", user);

      // Get the Firebase ID token
      const token = await user.getIdToken();

      // Store the token and user data
      localStorage.setItem("authToken", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        })
      );

      showToast.success("Welcome back to DesignFoli!");
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.";
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    try {
      const result = await loginWithGoogle();

      // Store user data for signup confirmation if new user

      console.log("Google login result:", state.user);
      if (state.user) {
        localStorage.setItem(
          "googleUser",
          JSON.stringify({
            uid: state.user.uid,
            displayName: state.user.displayName,
            email: state.user.email,
            photoURL: state.user.photoURL,
            accessToken: state.token,
          })
        );
      }

      router.push("/");
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  React.useEffect(() => {
    if (state.user && !state.isLoading) {
      router.push("/");
    }
  }, [state.user, state.isLoading, router]);

  if (state.user) {
    return null;
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="bg-gradient-to-t from-white/60 via-blue-400/60 to-purple-300/60 backdrop-blur-lg flex min-h-screen flex-col items-center justify-center px-4">
        <div className="bg-white p-8 sm:p-10 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg">
          <h2 className="text-3xl sm:text-5xl py-2 font-bold text-center bg-gradient-to-r from-[#6155F5] to-[#39328f] bg-clip-text text-transparent mb-3 sm:mb-8">
            DesignFoli
          </h2>
          <h2 className="text-xl sm:text-3xl font-semibold mb-6 text-center">Login</h2>

          <div className="flex flex-col items-center gap-3 mb-5">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={state.isLoading}
              className="flex items-center justify-center gap-2 w-full sm:w-3/5 rounded-full border py-3 sm:py-5 px-3 sm:px-4 text-sm sm:text-base"
            >
              <span className="flex-none">
                <FcGoogle />
              </span>
              <span className="truncate">Sign in with Google</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const emailForm = document.getElementById("email-form");
                if (emailForm) {
                  emailForm.style.display =
                    emailForm.style.display === "none" ? "block" : "none";
                }
              }}
              className="flex items-center justify-center gap-2 w-full sm:w-3/5 rounded-full border py-3 sm:py-5 px-3 sm:px-4 text-sm sm:text-base"
            >
              <span className="flex-none">
                <MdOutlineEmail />
              </span>
              <span className="truncate">Sign in with Email</span>
            </Button>
          </div>

          {/* Email login form - hidden by default */}
          <div id="email-form" style={{ display: "none" }}>
            <form onSubmit={handleSubmit} className="space-y-4 mb-5">
              <div>
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full py-2"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>

          <div className="text-center text-sm text-gray-900">
            Don&apos;t have an account?
          </div>
          <div
            onClick={() => router.push("/signup")}
            className="flex items-center justify-center mt-2 gap-2 hover:cursor-pointer text-blue-700 font-md"
          >
            <span>Sign up</span>
            <FaArrowRightLong />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default LoginPage;
// ...existing code...
