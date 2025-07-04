export interface Child {
  id: string;
  childName: string;
  dateOfBirth: Date;
  childPreferences: string;
}

export interface ChildrenState {
  children: Child[];
  loading: boolean;
  error: string | null;
}