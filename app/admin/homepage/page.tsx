import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import HomepageEditor, { type HomepageData } from "./HomepageEditor";

export const dynamic = "force-dynamic";

const DEFAULTS: HomepageData = {
  announcement: { text: "", style: "info" },
  hero: {
    title: "Horse Registry & Pedigree Records",
    subtitle: "Browse our full registry, explore bloodlines through interactive pedigree trees, and find horses available for purchase.",
    cta1: { label: "VIEW REGISTRY", href: "/registry" },
    cta2: { label: "HORSES FOR SALE", href: "/for-sale" },
  },
  cards: [
    { title: "Full Registry", desc: "All our registered horses in one place. Search by breed, colour, gender, or ownership and view full pedigree records.", href: "/registry", cta: "Browse Registry" },
    { title: "Resources", desc: "Player tools — plan show courses, work out foal genetics, or run a live scoreboard during events.", href: "/resources", cta: "Explore Resources" },
    { title: "For Sale", desc: "Horses currently available to buy from Redfield EC. Browse listings and get in touch.", href: "/for-sale", cta: "View Listings" },
  ],
  newsBlock: { enabled: false, heading: "Latest News", body: "" },
};

export default async function HomepageAdminPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const row = await prisma.siteContent.findUnique({ where: { key: "homepage" } });
  let data: HomepageData = DEFAULTS;
  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value) as Partial<HomepageData>;
      data = {
        announcement: { ...DEFAULTS.announcement, ...parsed.announcement },
        hero: { ...DEFAULTS.hero, ...parsed.hero, cta1: { ...DEFAULTS.hero.cta1, ...parsed.hero?.cta1 }, cta2: { ...DEFAULTS.hero.cta2, ...parsed.hero?.cta2 } },
        cards: parsed.cards?.length === 3 ? parsed.cards : DEFAULTS.cards,
        newsBlock: { ...DEFAULTS.newsBlock, ...parsed.newsBlock },
      };
    } catch { /* keep defaults */ }
  }

  return <HomepageEditor initial={data} />;
}
