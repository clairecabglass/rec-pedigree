import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const horses = await prisma.horse.findMany({
  select: { id: true, name: true, sireName: true, damName: true, ownership: true }
});

const byName = new Map(horses.map(h => [h.name.toLowerCase(), h]));

function countNodes(name, depth = 0, visited = new Set()) {
  if (!name || depth > 8) return 0;
  const key = name.toLowerCase();
  if (visited.has(key)) return 0;
  visited.add(key);
  const h = byName.get(key);
  if (!h) return 1;
  return 1 + countNodes(h.sireName, depth + 1, visited) + countNodes(h.damName, depth + 1, visited);
}

function maxDepth(name, depth = 0, visited = new Set()) {
  if (!name || depth > 8) return depth;
  const key = name.toLowerCase();
  if (visited.has(key)) return depth;
  visited.add(key);
  const h = byName.get(key);
  if (!h) return depth;
  return Math.max(maxDepth(h.sireName, depth + 1, new Set(visited)), maxDepth(h.damName, depth + 1, new Set(visited)));
}

const homeHorses = horses.filter(h => h.ownership === "Home");
const results = homeHorses.map(h => ({
  name: h.name,
  nodes: countNodes(h.name),
  depth: maxDepth(h.name),
})).sort((a, b) => b.nodes - a.nodes || b.depth - a.depth);

console.log("Top 10 by total pedigree nodes:");
results.slice(0, 10).forEach(r => console.log(`  ${r.name}: ${r.nodes} nodes, depth ${r.depth}`));
await prisma.$disconnect();
