export interface HorseData {
  id?: string;
  name: string;
  microchip?: string;
  breed?: string;
  gender?: string;
  sireName?: string;
  damName?: string;
  coat?: string;
  genotype?: string;
  ownership?: string;
  isImportedPlaceholder?: boolean;
  // Add other fields that might be extracted or relevant
}

export interface AncestorData extends HorseData {
  matchedHorseId: string | null;
  isDuplicate: boolean;
  // Potentially add generation, position in pedigree for complex review UI
}

export interface ParsedPedigreeData {
  rootHorse: HorseData;
  ancestors: HorseData[];
}
