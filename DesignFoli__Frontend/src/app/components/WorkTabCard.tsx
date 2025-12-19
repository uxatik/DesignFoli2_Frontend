import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { CaseStudy } from "../../../types/general";
import { getFullUrl } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WorkTabCardProps {
  experience: CaseStudy;
  publicProfile?: boolean;
  onCaseStudyUpdate?: () => void;
}

const WorkTabCard = ({
  experience,
  publicProfile = true,
  onCaseStudyUpdate,
}: WorkTabCardProps) => {
  const router = useRouter();
  const { state } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("en-US", {
  //     month: "short",
  //     year: "numeric",
  //   });
  // };

  // const handleViewClick = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   // If id exists and is not 0, navigate to the dynamic project page
  //   if (experience._id) {
  //     router.push(`/case-study/view/${experience._id}`);
  //   }
  // };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (experience._id) {
      router.push(`/case-study/${experience._id}`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!experience._id || !state.token) return;

    setIsDeleting(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(
        `${apiBaseUrl}/api/v1/users/profile/casestudy/${experience._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${state.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success) {
        showToast.success("Case study deleted successfully!");
        setIsDeleteDialogOpen(false);

        // Call the update callback to refresh the parent component
        if (onCaseStudyUpdate) {
          onCaseStudyUpdate();
        }
      } else {
        throw new Error(result.error || "Failed to delete case study");
      }
    } catch (error) {
      console.error("Error deleting case study:", error);
      showToast.error(
        error instanceof Error ? error.message : "Failed to delete case study"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate to view page when card is clicked
    console.log("Card clicked" + e.currentTarget);
    if (experience._id) {
      router.push(`/case-study/view/${experience._id}`);
    }
  };

  return (
    <>
      <div
        className="h-60 w-72 relative overflow-hidden rounded-lg cursor-pointer group hover:shadow-md transition-shadow"
        onClick={handleCardClick}
      >
        {/* Private indicator - only show for non-public profiles when case study is private */}
        {!publicProfile && experience.isPrivate && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-black/70 backdrop-blur-sm rounded-full p-1.5 shadow-md">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Edit/Delete dropdown menu - only show for non-public profiles */}
        {!publicProfile && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={handleEditClick}>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-red-600"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Image section - top 70% of card */}
        <div className="w-full h-[70%] relative overflow-hidden bg-gray-100">
          <Image
            src={getFullUrl(experience.thumbnailImage || "")}
            alt={experience.projectTitle}
            className="object-cover w-full h-full "
            width={288} // 72 * 4 = 288 (multiplying by 4 for higher resolution)
            height={168} // 60 * 0.7 * 4 = 168 (70% of height, multiplied by 4)
          />
        </div>

        {/* Text content - bottom 30% with white background */}
        <div className="absolute bottom-0 left-0 w-full h-[30%] bg-white p-3">
          <div className="text-xs uppercase font-semibold tracking-wider mb-1 text-[#333399]">
            {experience.tags?.[0] || "Project"}
          </div>
          <h3 className="text-[#1A1A1A] text-lg font-semibold line-clamp-1">
            {experience.projectTitle}
          </h3>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Case Study</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {experience.projectTitle}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkTabCard;
