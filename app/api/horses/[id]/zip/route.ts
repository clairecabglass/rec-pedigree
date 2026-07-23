import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { Zip, ZipDeflate, ZipPassThrough } from "fflate";

type Ctx = { params: Promise<{ id: string }> };

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ext(url: string, fallback = "bin") {
  const m = url.split("?")[0].match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : fallback;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const horse = await prisma.horse.findUnique({
    where: { id },
    include: {
      photos:     { orderBy: { order: "asc" } },
      videos:     { orderBy: { order: "asc" } },
      documents:  { orderBy: { createdAt: "asc" } },
    },
  });
  if (!horse) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await prisma.result.findMany({ where: { horseId: id }, orderBy: { date: "desc" } });

  const horseName = slug(horse.name);

  // Build the JSON export
  const jsonData = JSON.stringify({
    exportedAt: new Date().toISOString(),
    horse: {
      id:           horse.id,
      name:         horse.name,
      breed:        horse.breed,
      gender:       horse.gender,
      coat:         horse.coat,
      genotype:     horse.genotype,
      dob:          horse.dob?.toISOString() ?? null,
      regNumber:    horse.regNumber,
      microchip:    horse.microchip,
      height:       horse.height,
      discipline:   horse.discipline,
      ownership:    horse.ownership,
      sireName:     horse.sireName,
      damName:      horse.damName,
      notes:        horse.notes,
      personality:  horse.personality,
      price:        horse.price,
      breedingFee:  horse.breedingFee,
    },
    results: results.map(r => ({
      event:     r.event,
      placement: r.placement,
      date:      r.date?.toISOString() ?? null,
      notes:     r.notes,
    })),
    photos:    horse.photos.map(p => ({ url: p.url, caption: p.caption })),
    videos:    horse.videos.map(v => ({ url: v.url, caption: v.caption, mimeType: v.mimeType })),
    documents: horse.documents.map(d => ({ url: (d as { url?: string }).url ?? "", name: (d as { name?: string }).name ?? "" })),
  }, null, 2);

  // Build file list: { zipPath, url }
  const files: { path: string; url?: string; bytes?: Uint8Array }[] = [];

  files.push({ path: `${horseName}/data.json`, bytes: new TextEncoder().encode(jsonData) });

  horse.photos.forEach((p, i) => {
    files.push({ path: `${horseName}/photos/photo-${i + 1}.${ext(p.url, "jpg")}`, url: p.url });
  });
  horse.videos.forEach((v, i) => {
    files.push({ path: `${horseName}/videos/video-${i + 1}.${ext(v.url, "mp4")}`, url: v.url });
  });
  horse.documents.forEach((d, i) => {
    const doc = d as { url?: string; name?: string };
    const docName = doc.name ? slug(doc.name) : `document-${i + 1}`;
    files.push({ path: `${horseName}/documents/${docName}.${ext(doc.url ?? "", "pdf")}`, url: doc.url });
  });

  // Stream a zip via ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const zip = new Zip((err, data, final) => {
        if (err) { controller.error(err); return; }
        controller.enqueue(data);
        if (final) controller.close();
      });

      for (const file of files) {
        let bytes: Uint8Array;

        if (file.bytes) {
          bytes = file.bytes;
        } else if (file.url) {
          try {
            const res = await fetch(file.url);
            if (!res.ok) continue;
            bytes = new Uint8Array(await res.arrayBuffer());
          } catch {
            continue;
          }
        } else {
          continue;
        }

        // Use PassThrough for already-compressed formats (jpg/mp4/pdf/webm/mov)
        const isCompressed = /\.(jpe?g|mp4|webm|mov|avi|pdf|png)$/i.test(file.path);
        const entry = isCompressed
          ? new ZipPassThrough(file.path)
          : new ZipDeflate(file.path, { level: 6 });

        zip.add(entry);
        entry.push(bytes, true);
      }

      zip.end();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${horseName}-export.zip"`,
    },
  });
}
