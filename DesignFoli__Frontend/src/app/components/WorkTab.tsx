import React from "react";
import AddWorkCard from "./AddWorkCard";
import { Skeleton } from "@/components/ui/skeleton";
import WorkTabCard from "./WorkTabCard";
import EmptyItem from "./EmptyItem";
import { CaseStudy } from "../../../types/general";

interface WorkExperience {
  title: string;
  companyName: string;
  introduction: string;
  employmentType: string;
  locationMode: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  country: string;
  city: string;
  _id?: string;
}

interface WorkTabProps {
  publicProfile: boolean;
  workExperience?: CaseStudy[];
  onCaseStudyUpdate?: () => void;
}

const WorkTab = ({
  publicProfile,
  workExperience = [],
  onCaseStudyUpdate,
}: WorkTabProps) => {
  const hasWorkExperience = workExperience.length > 0;

  const displayedWorkExperience = publicProfile
    ? workExperience.filter((experience) => !experience.isPrivate)
    : workExperience;

  const hasDisplayedExperience = displayedWorkExperience.length > 0;

  return (
    <div className="flex flex-wrap gap-6">
      {/* Private Profile View (Owner's View)
        Show Add card first, then experience, then a skeleton.
      */}
      {!publicProfile && (
        <>
          {/* AddWorkCard is always first */}
          <AddWorkCard />

          {/* List all existing work cards */}
          {workExperience.map((experience, index) => (
            <WorkTabCard
              key={experience._id || index}
              experience={experience}
              publicProfile={publicProfile}
              onCaseStudyUpdate={onCaseStudyUpdate}
            />
          ))}

          {/* NEW SKELETON LOGIC:
            Show the skeleton only if there are 2 or fewer work items.
            Once there are 3 or more, the skeleton is hidden.
          */}
          {workExperience.length <= 2 && (
            <Skeleton className="w-72 h-60 rounded-lg" />
          )}
        </>
      )}

      {/* Public Profile View
        Show only the work cards OR an empty state.
      */}
      {publicProfile && (
        <>
          {hasDisplayedExperience ? (
            displayedWorkExperience.map((experience, index) => (
              <WorkTabCard
                key={experience._id || index}
                experience={experience}
                publicProfile={publicProfile}
                onCaseStudyUpdate={onCaseStudyUpdate}
              />
            ))
          ) : (
            /* Show EmptyItem if public and no experience */
            <EmptyItem
              title="No Work Experience Added"
              description="This user hasn't added any work experience yet."
            />
          )}
        </>
      )}
    </div>
  );
};

export default WorkTab;
