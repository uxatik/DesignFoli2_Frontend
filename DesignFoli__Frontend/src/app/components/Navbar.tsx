"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";
import Link from "next/link";

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

const Navbar = ({
  showOnlyWhenAuthenticated = true,
}: {
  showOnlyWhenAuthenticated?: boolean;
}) => {
  const [userImg, setUserImg] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [sheetView, setSheetView] = useState<"style" | "menu">("style");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(defaultStyle);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { state, logout } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!state.token) return;

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const response = await fetch(`${apiBaseUrl}/api/v1/users/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUserImg(result.data.firebasePhotoURL || null);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [state.token]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const handleEditProfile = () => {
    router.push("/editprofile");
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("googleUser");
      showToast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      showToast.error("Failed to logout");
    }
  };

  useEffect(() => {
    if (open && state.token && sheetView === "style") {
      fetchStyleConfig();
    }
  }, [open, state.token, sheetView]);

  const fetchStyleConfig = async () => {
    if (!state.token) return;
    setIsLoading(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Fetched profile data:", result);
        setUserImg(result.data.firebasePhotoURL || null);

        if (result.success && result.data && result.data.style) {
          setStyleConfig(result.data.style);
        }
      }
    } catch (error) {
      console.error("Error fetching style config:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleFieldChange = (
    field: keyof Omit<StyleConfig, "colors">,
    value: string
  ) => {
    setStyleConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDone = async () => {
    if (!state.token) {
      showToast.error("Authentication required");
      return;
    }

    setIsSaving(true);
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

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showToast.success("Style updated successfully!");
          setOpen(false);
        } else {
          showToast.error(result.error || "Failed to update style");
        }
      } else {
        showToast.error("Failed to update style");
      }
    } catch (error) {
      console.error("Error saving style config:", error);
      showToast.error("Error saving style configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDefault = () => {
    setStyleConfig(defaultStyle);
  };

  const handleMyProfile = async () => {
    if (!state.token) {
      showToast.error("Authentication required");
      return;
    }

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${state.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.username) {
          const profileUrl = `${window.location.origin}/${result.data.username}`;
          await navigator.clipboard.writeText(profileUrl);
          showToast.success("Link copied!");
        } else {
          showToast.error("Not published yet");
        }
      } else {
        showToast.error("Not published yet");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast.error("Not published yet");
    }
  };

  if (showOnlyWhenAuthenticated && (!state.user || !state.token)) {
    return null;
  }

  const openMobileMenu = () => {
    setSheetView("menu");
    setOpen(true);
  };

  return (
    <>
      {/* UPDATED NAV WIDTH LOGIC: 
        Replaced `w-full` with `w-[calc(100%-2rem)]` to create side margins on mobile.
        Added `md:w-full` to reset width behavior on larger screens (still constrained by max-w-3xl).
      */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/60 backdrop-blur-sm border border-white/30 rounded-full shadow-sm px-4 py-2 flex items-center justify-between max-w-3xl w-[calc(100%-1rem)] md:w-full">
        <div className="flex items-center">
          {isMobile ? (
            <Image
              src={userImg || "/assets/images/user.png"}
              alt="User"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Image
                  src={userImg || "/assets/images/user.png"}
                  alt="User"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-0 w-44">
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Link href="/" className="w-full">
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEditProfile}>
                  Edit profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMyProfile}>
                  Share link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="hidden md:flex gap-6">
          <a
            href="#"
            className="text-[#1A1A1A] font-medium hover:text-[#6155F5] transition"
          >
            My Portfolio
          </a>
          <button
            type="button"
            onClick={() => {
              setSheetView("style");
              setOpen(true);
            }}
            className="text-[#1A1A1A] font-medium hover:text-[#6155F5] transition bg-transparent border-none p-0"
          >
            Edit style
          </button>
        </div>

        <div className="flex items-center">
          {isMobile ? (
            <button
              onClick={openMobileMenu}
              aria-label="Open menu"
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-800"
                aria-hidden
              >
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <div className="hidden md:flex gap-3">
              <Link href="/preview">
                <button className=" text-[#25A1F4] px-4 py-1 rounded-full font-medium hover:bg-[#25A1F4] transition border-1 border-[#25A1F4] hover:text-white">
                  Preview
                </button>
              </Link>
              <Link href="/publish">
                <button className="bg-[#25A1F4] text-white px-4 py-1 rounded-full font-medium hover:bg-[#39328f] transition">
                  Publish portfolio
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className={`${
            isMobile ? "w-56" : "w-[420px]"
          } max-w-full overflow-x-hidden`}
        >
          <SheetHeader>
            <SheetTitle className="text-2xl font-semibold">
              {sheetView === "menu" ? "Menu" : "Style"}
            </SheetTitle>
          </SheetHeader>

          {sheetView === "menu" ? (
            <div className="p-1 flex flex-col">
              <button
                onClick={() => {
                  router.push("/");
                  setOpen(false);
                }}
                className="w-full text-left py-2 px-3 bg-white border-b border-gray-200 text-gray-800 normal-case rounded-none text-sm"
              >
                Home
              </button>

              <button
                onClick={() => {
                  handleEditProfile();
                  setOpen(false);
                }}
                className="w-full text-left py-2 px-3 bg-white border-b border-gray-200 text-gray-800 normal-case rounded-none text-sm"
              >
                Edit profile
              </button>

              <button
                onClick={() => {
                  handleMyProfile();
                  setOpen(false);
                }}
                className="w-full text-left py-2 px-3 bg-white border-b border-gray-200 text-gray-800 normal-case rounded-none text-sm"
              >
                Share link
              </button>

              <button
                onClick={() => {
                  setSheetView("style");
                }}
                className="w-full text-left py-2 px-3 bg-white border-b border-gray-200 text-gray-800 normal-case rounded-none text-sm"
              >
                Edit style
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setOpen(false);
                }}
                className="w-full text-left py-2 px-3 bg-white text-red-600 normal-case rounded-none text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-3">Loading...</span>
                </div>
              ) : (
                <div className="grid flex-1 auto-rows-min gap-4 px-3 overflow-y-auto max-h-screen min-w-0">
                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="font-select" className="text-sm">
                      Font
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between text-sm"
                        >
                          {styleConfig.font}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full min-w-0 left-0">
                        <DropdownMenuItem
                          onClick={() =>
                            handleFieldChange("font", "Sans Serif")
                          }
                        >
                          Sans serif
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFieldChange("font", "Serif")}
                        >
                          Serif
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFieldChange("font", "Monospace")}
                        >
                          Monospace
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFieldChange("font", "Cursive")}
                        >
                          Cursive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="heading-select" className="text-sm">
                      Heading style
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between text-sm"
                        >
                          {styleConfig.headingStyle}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full min-w-0 left-0">
                        <DropdownMenuItem
                          onClick={() =>
                            handleFieldChange("headingStyle", "Light")
                          }
                        >
                          Light
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleFieldChange("headingStyle", "Regular")
                          }
                        >
                          Regular
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleFieldChange("headingStyle", "Semi-Bold")
                          }
                        >
                          Semi-bold
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleFieldChange("headingStyle", "Bold")
                          }
                        >
                          Bold
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-12">Colors</span>
                      <input
                        type="color"
                        value={styleConfig.colors.primary}
                        onChange={(e) =>
                          handleColorChange("primary", e.target.value)
                        }
                        className="w-10 h-10 rounded-full cursor-pointer appearance-none border-0 p-0"
                        style={{
                          WebkitAppearance: "none",
                          borderRadius: "50%",
                          overflow: "hidden",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-sm">Button style</Label>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          handleFieldChange("buttonStyle", "Stroke")
                        }
                        className={`px-4 py-2 rounded-full border font-medium text-sm transition ${
                          styleConfig.buttonStyle === "Stroke"
                            ? "border-[#6155F5] text-[#6155F5] bg-blue-50"
                            : "border-gray-300 text-gray-600 bg-transparent"
                        }`}
                      >
                        Stroke
                      </button>
                      <button
                        onClick={() => handleFieldChange("buttonStyle", "Fill")}
                        className={`px-4 py-2 rounded-full border font-medium text-sm transition ${
                          styleConfig.buttonStyle === "Fill"
                            ? "bg-[#6155F5] text-white border-[#6155F5]"
                            : "bg-gray-100 text-gray-600 border-gray-300"
                        }`}
                      >
                        Fill
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-sm">Spacing</Label>
                    <div className="flex items-center justify-between w-full px-1">
                      {(["S", "M", "L", "XL"] as const).map(
                        (size, idx, arr) => (
                          <React.Fragment key={size}>
                            <button
                              type="button"
                              onClick={() => handleFieldChange("spacing", size)}
                              className={`w-9 h-9 flex items-center justify-center rounded-full border-2 font-semibold text-sm transition ${
                                styleConfig.spacing === size
                                  ? "border-[#6155F5] bg-blue-50 text-[#6155F5]"
                                  : "border-gray-300 bg-white text-[#1A1A1A] hover:border-[#6155F5]"
                              }`}
                              aria-label={size}
                            >
                              {size}
                            </button>
                            {idx < arr.length - 1 && (
                              <div className="h-1 w-4 bg-gray-300" />
                            )}
                          </React.Fragment>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 my-4">
                    <button
                      onClick={handleDone}
                      disabled={isSaving}
                      className="flex-1 bg-[#6155F5] text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-[#39328f] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Done"}
                    </button>
                    <button
                      onClick={handleDefault}
                      disabled={isSaving}
                      className="flex-1 bg-[#F6F6F6] text-[#1A1A1A] px-4 py-2 rounded-full font-medium text-sm border border-[#1A1A1A] hover:bg-[#eaeaea] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Default
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Navbar;
