const STRING_FIELDS = [
  "microchip", "name", "breed", "gender", "sireName", "damName", "coat",
  "ownership", "notes", "height", "discipline", "regNumber", "achievements",
  "videoUrl", "personality", "genotype", "eyeColor", "baseStats", "description",
  "ownerName", "ownerCharacter", "stablePrefix", "breedingFee", "breedingPolicies",
  "price", "saleDescription", "saleContact", "lifeStage",
] as const;

// Pull only editable Horse fields out of an arbitrary request body.
export function sanitizeHorseInput(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  const NAME_FIELDS = new Set(["name", "sireName", "damName"]);
  for (const f of STRING_FIELDS) {
    if (f in body) {
      const v = body[f] === "" ? null : body[f];
      data[f] = (NAME_FIELDS.has(f) && typeof v === "string") ? v.toUpperCase() : v;
    }
  }
  if ("withFoal" in body) data.withFoal = Boolean(body.withFoal);
  if ("availableForBreeding" in body) data.availableForBreeding = Boolean(body.availableForBreeding);
  if ("isCustomHorse" in body) data.isCustomHorse = Boolean(body.isCustomHorse);
  if ("hasCustomCoat" in body) data.hasCustomCoat = Boolean(body.hasCustomCoat);
  if ("isImportedPlaceholder" in body) data.isImportedPlaceholder = Boolean(body.isImportedPlaceholder);
  if ("dob" in body) data.dob = body.dob ? new Date(body.dob as string) : null;
  return data;
}
