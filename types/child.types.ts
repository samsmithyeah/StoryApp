export interface Child {
  id: string;
  childName: string;
  dateOfBirth?: Date;
  childPreferences?: string;
  hairColor?: string;
  eyeColor?: string;
  skinColor?: string;
  hairStyle?: string;
  appearanceDetails?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChildrenState {
  children: Child[];
  loading: boolean;
  error: string | null;
}
