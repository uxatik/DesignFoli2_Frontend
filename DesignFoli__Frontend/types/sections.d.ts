export interface FieldOption {
  type: 'text' | 'picture' | 'checkbox' | 'textarea' | 'number';
  label: string;
  name: string;
  required: boolean;
  order: number;
  repeatable: boolean;
  subFields: FieldOption[];
  _id: string;
  options: string[];
  value?: string | File | File[] | string[];
}

export interface Section {
  _id: string;
  section: string;
  order: number;
  fields: FieldOption[];
  __v: number;
  createdAt: string;
  updatedAt: string;
}

export interface SectionsResponse {
  success: boolean;
  data: Section[];
}

export interface ConfigurationResponse {
  success: boolean;
  data?: {
    _id: string;
    sections: Section[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

export interface SelectedField {
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  sectionId: string;
  sectionName: string;
  required: boolean;
  order: number;
  selected: boolean;
}

export interface DynamicCaseStudyData {
  projectTitle: string;
  // Basic info (step 1)
  title: string;
  description: string;
  coverImage: File | string | null;
  thumbnailImage: File | string | null;
  clientName: string;
  projectDate: string;
  category: string;
  tags: string[];
  isPrivate?: boolean;

  // Selected fields (step 1)
  selectedFields: SelectedField[];

  // Dynamic field values (step 2)
  fieldValues: Record<string, string | File | File[] | string[]>;
  [key: string]: string | string[] | File | File[] | number | null | SelectedField[] | Record<string, string | File | File[] | string[]> | boolean;
}
