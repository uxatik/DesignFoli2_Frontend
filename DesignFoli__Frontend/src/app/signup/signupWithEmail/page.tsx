"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/lib/toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const formSchema = z
  .object({
    userName: z
      .string()
      .min(3, { message: "Name must be at least 3 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one symbol.",
      }),
    confirmPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one symbol.",
      }),
    title: z.string().optional(),
    companyName: z.string().optional(),
    introText: z
      .string()
      .max(200, { message: "Intro text must be at most 200 characters." })
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const FaArrowRightLong = dynamic(
  () => import("react-icons/fa6").then((mod) => mod.FaArrowRightLong),
  { ssr: false }
);

const SignupWithEmailPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
      title: "",
      companyName: "",
      introText: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare data for email registration API
      const registrationData = {
        name: values.userName,
        email: values.email,
        password: values.password,
        username: values.userName,
        title: values.title || "",
        companyName: values.companyName || "",
        introduction: values.introText || "",
      };

      console.log("Sending registration data:", registrationData);

      // Call email registration API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const registerResponse = await fetch(`${apiBaseUrl}/api/v1/auth/email/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${registerResponse.status}`);
      }

      const registerResult = await registerResponse.json();
      console.log("Registration successful:", registerResult);

      if (registerResult.success) {
        showToast.success("Account created successfully! Logging you in...");
        
        // Now login with Firebase signInWithEmailAndPassword
        console.log("Attempting Firebase login with:", { email: values.email, password: values.password });

        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        
        console.log("Firebase login successful:", user);
        
        // Get the Firebase ID token
        const token = await user.getIdToken();
        
        // Store the token and user data
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }));
        
        showToast.success("Welcome to DesignFoli!");
        router.push("/");
      } else {
        throw new Error(registerResult.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration/Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong, please try again.";
      setSubmitError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-gradient-to-t from-white/60 via-blue-400/60 to-purple-300/60 backdrop-blur-lg flex min-h-screen flex-col items-center justify-center">
      <div className="bg-white p-10 rounded-lg shadow-lg min-w-2/6">
        <h2 className="text-3xl py-2 font-bold bg-gradient-to-r from-[#6155F5] to-[#39328f] bg-clip-text text-transparent mb-5">
          DesignFoli
        </h2>
        <h2 className="text-lg font-semibold mb-6">Sign up</h2>
        <div className="flex flex-col mb-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Example: John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Example: john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Example: Software Engineer"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Example: ABC Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="introText"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Introduction</FormLabel>
                      <span className="text-xs text-gray-500">
                        {field.value?.length || 0}/200
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Example: Product designer with 5 years of experience..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full rounded-4xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>
        </div>
        <div className="text-center text-sm text-gray-900">
          Already have an account?
        </div>
        <div
          onClick={() => router.push("/login")}
          className="flex items-center justify-center mt-2 gap-2 hover:cursor-pointer text-blue-700 font-md"
        >
          <span>Login</span>
          <FaArrowRightLong />
        </div>
      </div>
    </div>
  );
};

export default SignupWithEmailPage;
