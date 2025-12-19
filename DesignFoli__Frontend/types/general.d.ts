export interface Skill {
  _id?: string;
  category: string;
  name: string;
}

export interface Education {
  _id?: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface StyleConfig {
  font: 'Serif' | 'Sans-serif' | 'Monospace';
  headingStyle: 'Bold' | 'Medium' | 'Light';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  buttonStyle: 'Filled' | 'Stroke' | 'Text';
  spacing: 'S' | 'M' | 'L' | 'XL';
}

export interface CaseStudy {
  _id: string;
  projectTitle: string;
  tags: string[];
  selectedFields: {
    fieldId: string;
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    sectionId: string;
    sectionName: string;
    required: boolean;
    order: number;
    selected: boolean;
  }[];
  fieldValues: string;
  coverImage: string;
  thumbnailImage: string;
  overview?: string[];
  paper_sketching?: string[];
  isPrivate?: boolean;
  // Additional dynamic field values can be added as needed
}

export interface UserInfo {
  _id: string;
  firebaseUid: string;
  email: string;
  username: string;
  authProvider: string[];
  firebasePhotoURL?: string;
  emailVerified: boolean;

  profile: {
    displayName: string;
    bio: string;
    experience: {
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
    }[];
    education: Education[];
    skills: Skill[];
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
      dribbble?: string;
      instagram?: string;
      behance?: string;
    };
    caseStudies: CaseStudy[];
  };

  professionalInfo: {
    title: string;
    companyName: string;
    introduction: string;
  };

  styleConfig?: StyleConfig;

  role: "user" | "admin" | "superadmin";
  verified: boolean;
  lastLogin: string;
  lastSync: string;
  createdAt: string;
  updatedAt: string;
  resumeURL: string;
}
