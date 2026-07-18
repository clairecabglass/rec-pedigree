/**
 * Returns an approximate CSS colour (or gradient) for a coat name.
 * Used to render a small visual swatch next to coat labels.
 * Returns null if the name doesn't map to a known colour.
 */
export function getCoatSwatch(coatName: string | null | undefined): string | null {
  if (!coatName) return null;
  const n = coatName.toLowerCase();

  // Dilutes & special bases (check before generic base colours)
  if (n.includes("cremello"))                               return "#F5E4C0";
  if (n.includes("perlino"))                                return "#EDD8A0";
  if (n.includes("smoky cream") || n.includes("smoky"))    return "#E8D8B0";
  if (n.includes("palomino"))                               return "#D4A84B";
  if (n.includes("buckskin"))                               return "#C8A840";
  if (n.includes("grulla") || n.includes("grullo"))        return "#8E9BA0";
  if (n.includes("dun"))                                    return "#C4A870";
  if (n.includes("silver dapple"))                         return "#9A8E80";
  if (n.includes("silver bay"))                             return "#9A8060";
  if (n.includes("silver"))                                 return "#A8A090";

  // Chestnut family
  if (n.includes("liver chestnut") || n.includes("liver")) return "#7A3020";
  if (n.includes("flaxen chestnut") || n.includes("flaxen")) return "#D47820";
  if (n.includes("chestnut") || n.includes("sorrel"))      return "#B85828";

  // Bay family
  if (n.includes("blood bay"))                              return "#8B2020";
  if (n.includes("dark bay") || n.includes("brown"))       return "#4A2808";
  if (n.includes("bay"))                                    return "#8B4513";

  // Roan family
  if (n.includes("blue roan"))                             return "#708090";
  if (n.includes("red roan") || n.includes("strawberry"))  return "#B07878";
  if (n.includes("roan"))                                   return "#A08878";

  // Grey / White
  if (n.includes("dapple grey") || n.includes("dapple gray")) return "#C0C0C0";
  if (n.includes("fleabitten"))                             return "#D8D8D0";
  if (n.includes("grey") || n.includes("gray"))            return "#C8C8C8";
  if (n.includes("white"))                                  return "#F0EEE8";

  // Black
  if (n.includes("black"))                                  return "#2A2A2A";

  // Patterned coats — diagonal split swatch
  if (n.includes("appaloosa") || n.includes("leopard"))
    return "linear-gradient(135deg, #C0A070 55%, #F0EEE8 55%)";
  if (n.includes("tobiano") || n.includes("tovero") || n.includes("overo")
    || n.includes("pinto") || n.includes("paint"))
    return "linear-gradient(135deg, #8B4513 50%, #F0EEE8 50%)";
  if (n.includes("sabino"))
    return "linear-gradient(135deg, #F0EEE8 35%, #C0A070 35%)";

  return null;
}
