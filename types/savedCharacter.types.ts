export interface SavedCharacter {
  id: string;
  name: string;
  description?: string;
  appearance?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SavedCharactersState {
  characters: SavedCharacter[];
  loading: boolean;
  error: string | null;
}
