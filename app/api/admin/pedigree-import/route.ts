import { NextRequest, NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadFile } from "@/lib/storage"; // Corrected import name
import { parsePedigreeImage } from "@/lib/pedigree-parser";
import { HorseData, AncestorData } from "@/lib/types";

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const imageFile = formData.get("image") as File | null;

  if (!imageFile) {
    return NextResponse.json({ error: "No image file provided." }, { status: 400 });
  }

  try {
    // Read the File object into a Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload image to R2 (or local dev storage)
    const { url, key } = await uploadFile( // Corrected function name
      "pedigree-imports", // folder
      imageFile.name,     // filename
      buffer,             // buffer
      imageFile.type      // contentType
    );

    // 2. Process image (OCR and parsing)
    const parsedData = await parsePedigreeImage(url); 

    // ... (rest of the code remains the same)

    return NextResponse.json({
      success: true,
      imageUrl: url,
      imageKey: key,
      rootHorse,
      ancestors,
      // Add more data as needed for the review step
    }, { status: 200 });

  } catch (error: any) {
    console.error("Pedigree import failed:", error);
    return NextResponse.json({ error: error.message || "Failed to process pedigree image." }, { status: 500 });
  }
}
