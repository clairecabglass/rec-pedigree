export interface HorseData {
  id?: string;
  name: string;
  microchip?: string;
  breed?: string;
  gender?: string;
  sireName?: string;
  damName?: string;
  coat?: string;
  genotype?: string | null;
  ownership?: string | null;
  isImportedPlaceholder?: boolean;
  // Add other fields that might be extracted or relevant
}

// Represents a full horse record as fetched from the database,
// used where more comprehensive data is needed (e.g., Breeding tools, Share cards).
export interface FullHorseData {
  id: string;
  name: string;
  breed: string | null;
  gender: string | null;
  coat: string | null;
  genotype: string | null;
  sireName: string | null;
  damName: string | null;
  ownership: string | null; // e.g., "Home", "For Sale", "Outside"
  isImportedPlaceholder: boolean; // Indicates if this horse was imported as a minimal placeholder
  // Add other fields from your Prisma Horse model that are relevant for UI/logic here
  regNumber?: string | null;
  stablePrefix?: string | null;
  breedingFee?: string | null;
  breedingPolicies?: string | null;
  price?: string | null;
  saleDescription?: string | null;
  saleContact?: string | null;
}

export interface AncestorData extends HorseData {
  matchedHorseId: string | null;
  isDuplicate: boolean;
  // Potentially add generation, position in pedigree for complex review UI
}

export interface ParsedPedigreeData {
  rootHorse: HorseData;
  ancestors: HorseData[];
  rawModelNotes?: string | null;
}
