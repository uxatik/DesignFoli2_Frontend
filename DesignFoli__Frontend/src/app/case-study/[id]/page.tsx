import { Metadata } from "next";
import { auth } from "@/lib/firebase";
import CaseStudyClient from "./CaseStudyClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  // For new case study (id="0"), return default title
  if (id === "0") {
    return {
      title: "Create Case Study | DesignFoli",
    };
  }

  try {
    // Get the current user token
    const user = auth.currentUser;
    if (!user) {
      return {
        title: "Case Study | DesignFoli",
      };
    }

    const token = await user.getIdToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    // Fetch case study data to get the projectTitle
    const response = await fetch(`${apiBaseUrl}/api/v1/users/profile/casestudy/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        // Try title first (primary field), then projectTitle as fallback
        const projectTitle = result.data.title || result.data.projectTitle;
        if (projectTitle) {
          return {
            title: `${projectTitle} | DesignFoli`,
          };
        }
      }
    }
  } catch (error) {
    console.error("Error fetching case study for metadata:", error);
  }

  // Fallback title
  return {
    title: "Case Study | DesignFoli",
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { id } = await params;
  
  return <CaseStudyClient caseStudyId={id} />;
}
