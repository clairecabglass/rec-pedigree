import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

interface PedNode {
  name?: string;
  breed?: string | null;
  gender?: string | null;
  coat?: string | null;
  genotype?: string | null;
  sire?: PedNode | null;
  dam?: PedNode | null;
}

/**
 * Walk the tree and upsert a Horse record for every named non-root ancestor.
 * Existing DB horses get their fields updated only where the tree has non-null data.
 * New ancestors are created as isImportedPlaceholder = true.
 * Returns early for null / "Unknown" / "Foundation..." nodes.
 */
async function upsertAncestors(node: PedNode, seen: Set<string>): Promise<void> {
  if (!node.name) return;
  const key = node.name.trim().toLowerCase();
  if (!key || key === "unknown" || key.startsWith("foundation")) return;
  if (seen.has(key)) return; // avoid double-upsert for inbred ancestors
  seen.add(key);

  const canonName = node.name.trim().toUpperCase();
  const existing = await prisma.horse.findFirst({
    where: { name: { equals: canonName, mode: "insensitive" } },
    select: { id: true, isImportedPlaceholder: true },
  });

  const sireName = (node.sire?.name ?? null)?.trim().toUpperCase() || null;
  const damName  = (node.dam?.name  ?? null)?.trim().toUpperCase() || null;

  if (existing) {
    // Update only non-null fields so we don't overwrite richer DB data with blanks
    const data: Record<string, unknown> = { sireName, damName };
    if (node.breed)    data.breed    = node.breed;
    if (node.gender)   data.gender   = node.gender;
    if (node.coat)     data.coat     = node.coat;
    if (node.genotype) data.genotype = node.genotype;
    await prisma.horse.update({ where: { id: existing.id }, data });
  } else {
    await prisma.horse.create({
      data: {
        name:                 canonName,
        breed:                node.breed    ?? null,
        gender:               node.gender   ?? null,
        coat:                 node.coat     ?? null,
        genotype:             node.genotype ?? null,
        sireName,
        damName,
        isImportedPlaceholder: true,
      },
    });
  }

  // Recurse into children
  if (node.sire) await upsertAncestors(node.sire, seen);
  if (node.dam)  await upsertAncestors(node.dam,  seen);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const horse = await prisma.horse.findUnique({ where: { id }, select: { id: true } });
  if (!horse) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { tree: PedNode };
  const tree = body.tree;
  if (!tree) return NextResponse.json({ error: "Missing tree" }, { status: 400 });

  // Upsert all ancestors (skip root — that's the horse being edited)
  const seen = new Set<string>();
  if (tree.sire) await upsertAncestors(tree.sire, seen);
  if (tree.dam)  await upsertAncestors(tree.dam,  seen);

  // Update root horse: sireName/damName + pedigreeTree cache
  await prisma.horse.update({
    where: { id },
    data: {
      sireName:     (tree.sire?.name ?? null)?.trim().toUpperCase() || null,
      damName:      (tree.dam?.name  ?? null)?.trim().toUpperCase() || null,
      pedigreeTree: tree as object,
    },
  });

  return NextResponse.json({ ok: true });
}
