import OpenAI from "openai";
import { ParsedPedigreeData, HorseData } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// This function now integrates with OpenAI Vision for actual pedigree parsing.
export async function parsePedigreeImage(imageUrl: string): Promise<ParsedPedigreeData> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  console.log(`Sending image to OpenAI Vision for parsing: ${imageUrl}`);

  const prompt = `You are an expert pedigree data extractor for horses. Your task is to analyze the provided image of a horse pedigree chart, identify the root horse and its ancestors, and extract specific information for each.

**Crucial Instructions:**
1.  **Output Format:** Respond STRICTLY with a JSON object. Ensure the JSON is valid and complete.
2.  **Root Horse:** The horse whose pedigree it is (typically the leftmost horse in the chart) should be identified as the rootHorse.
3.  **Ancestors:** All other horses identified in the pedigree should be listed in the ancestors array.
4.  **Field Confidence:** If you are NOT confident about a field's value (e.g., breed, gender, coat, genotype), leave that field as null in the JSON. **Do NOT guess or invent values.**
5.  **Ownership:** For all ancestors, set the ownership field to "Outside not owned". For the rootHorse, set ownership to null (as its ownership will be handled separately).
6.  **Relationships:** Infer sire and dam relationships from the visual layout of the pedigree chart (lines, positioning).
7.  **uncertainFields:** For each horse, include an array uncertainFields. If any field (name, gender, breed, coat, genotype, sireName, damName) was difficult to extract or you have low confidence in its accuracy, list the names of those fields in this array (e.g., ["breed", "genotype"]). If all fields are extracted with high confidence, this array should be empty [].
8.  **rawModelNotes:** Include a rawModelNotes string in the top-level JSON for any general observations or difficulties encountered during extraction (e.g., "Image quality was low", "Pedigree layout was unusual"). If no notes, set to null.

**JSON Structure (Strictly follow this):**

{
  "rootHorse": {
    "name": "string | null",
    "gender": "Mare | Stallion | null",
    "breed": "string | null",
    "coat": "string | null",
    "genotype": "string | null",
    "sireName": "string | null",
    "damName": "string | null",
    "ownership": "Home | For Sale | Sold | Outside | Void | Expected | Outside not owned | null",
    "uncertainFields": ["string"]
  },
  "ancestors": [
    {
      "name": "string | null",
      "gender": "Mare | Stallion | null",
      "breed": "string | null",
      "coat": "string | null",
      "genotype": "string | null",
      "sireName": "string | null",
      "damName": "string | null",
      "ownership": "Home | For Sale | Sold | Outside | Void | Expected | Outside not owned | null",
      "uncertainFields": ["string"]
    }
  ],
  "rawModelNotes": "string | null"
}

**Additional Context for Pedigree Interpretation:**
*   **Generations:** Pedigrees typically show the horse, then its parents, then grandparents, etc., moving from left to right.
*   **Gender Identification:** Try to infer gender from names (e.g., "Mare" for female-sounding names) or other visual cues if present. If unsure, default to null.
*   **Genotype:** Often appears in parentheses or small text next to the coat or name.
*   **Breed:** May be abbreviated or placed near the name.

Now, analyze the image and provide the JSON output.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o for its vision capabilities
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high", // Request high-detail image processing
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" }, // Ensure JSON output
    });

    const jsonString = response.choices[0].message.content;
    if (!jsonString) {
      throw new Error("OpenAI did not return any content.");
    }

    const parsedData: ParsedPedigreeData = JSON.parse(jsonString);

    // Basic validation to ensure the structure is roughly correct
    if (!parsedData.rootHorse || !parsedData.ancestors) {
      throw new Error("OpenAI response did not contain expected rootHorse or ancestors structure.");
    }

    // Ensure ownership for ancestors is correctly set to "Outside not owned"
    // and for rootHorse is null, as per requirements.
    if (parsedData.rootHorse.ownership !== null) {
      parsedData.rootHorse.ownership = null;
      if (!parsedData.rawModelNotes) parsedData.rawModelNotes = "";
      parsedData.rawModelNotes += " (Ownership of rootHorse was adjusted to null as per instructions)";
    }
    parsedData.ancestors = parsedData.ancestors.map(ancestor => {
      if (ancestor.ownership !== "Outside not owned") {
        ancestor.ownership = "Outside not owned";
        if (!parsedData.rawModelNotes) parsedData.rawModelNotes = "";
        parsedData.rawModelNotes += ` (Ownership of ancestor ${ancestor.name || 'unnamed'} was adjusted to "Outside not owned")`;
      }
      return ancestor;
    });

    return parsedData;

  } catch (error) {
    console.error("Error calling OpenAI Vision API:", error);
    throw new Error(`Failed to parse pedigree image using OpenAI Vision: ${error instanceof Error ? error.message : String(error)}`);
  }
}
