const STRING_FIELDS = [
  "microchip", "name", "breed", "gender", "sireName", "damName", "coat",
  "ownership", "notes", "height", "discipline", "regNumber", "achievements",
  "videoUrl", "price", "saleDescription", "saleContact",
] as const;

// Pull only editable Horse fields out of an arbitrary request body.
export function sanitizeHorseInput(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const f of STRING_FIELDS) {
    if (f in body) data[f] = body[f] === "" ? null : body[f];
  }
  if ("withFoal" in body) data.withFoal = Boolean(body.withFoal);
  if ("dob" in body) data.dob = body.dob ? new Date(body.dob as string) : null;
  return data;
}
