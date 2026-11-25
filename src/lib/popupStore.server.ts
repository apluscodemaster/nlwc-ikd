// Server-only: site pop-ups in Firestore (`site_popups`), read and written
// through the Admin SDK by /api/popups and /api/popups/admin.
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  BUILT_IN_IDS,
  BUILT_IN_POPUPS,
  type SitePopup,
  type SitePopupInput,
} from "@/lib/sitePopups";

const COLLECTION = "site_popups";
const META = { collection: "site_popups_meta", id: "settings" };

const path = z.string().trim().max(200).regex(/^\/[^\s]*$/, "Paths start with / and have no spaces");
const isoOrEmpty = z
  .string()
  .trim()
  .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), "Not a valid date");
const urlOrEmpty = z
  .string()
  .trim()
  .max(2000)
  .refine((s) => s === "" || /^https:\/\/\S+$/i.test(s) || /^\/\S*$/.test(s), "Use a full https:// link or a site path like /live");

export const popupInputSchema = z
  .object({
    kind: z.enum(["announcement", "fellowship", "devotional", "first-time-visitor"]),
    name: z.string().trim().min(1, "Give it a name").max(120),
    active: z.boolean(),
    eyebrow: z.string().trim().max(60),
    title: z.string().trim().max(140),
    message: z.string().trim().max(1500),
    imageUrl: z
      .string()
      .trim()
      .max(2000)
      .refine((s) => s === "" || /^https:\/\/\S+$/i.test(s), "Image must be a full https:// link"),
    ctaLabel: z.string().trim().max(60),
    ctaUrl: urlOrEmpty,
    dismissLabel: z.string().trim().max(80),
    whatsapp: z
      .string()
      .trim()
      .regex(/^\d{0,15}$/, "WhatsApp number: digits only, with country code (e.g. 2348012345678)"),
    layout: z.enum(["modal", "corner"]),
    includePaths: z.array(path).max(30),
    excludePaths: z.array(path).max(30),
    liveOnly: z.boolean(),
    delaySeconds: z.number().int().min(0).max(600),
    frequency: z.enum(["every-visit", "once-per-session", "once-every-days", "until-completed"]),
    frequencyDays: z.number().int().min(1).max(365),
    startsAt: isoOrEmpty,
    endsAt: isoOrEmpty,
    priority: z.number().int().min(-100).max(100),
  })
  .superRefine((p, ctx) => {
    if (p.kind === "announcement" && !p.title) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "An announcement needs a title" });
    }
    if (p.kind === "announcement" && p.ctaLabel && !p.ctaUrl) {
      ctx.addIssue({ code: "custom", path: ["ctaUrl"], message: "Add the link the button opens (or clear the button text)" });
    }
    if (p.startsAt && p.endsAt && Date.parse(p.endsAt) <= Date.parse(p.startsAt)) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "The end must be after the start" });
    }
  });

function fromDoc(id: string, data: Partial<SitePopup>): SitePopup {
  // Fill any field missing from older documents with the built-in/blank default.
  const base = BUILT_IN_POPUPS.find((p) => p.id === id) ?? { ...BUILT_IN_POPUPS[0], ...blankAnnouncement() };
  return { ...base, ...data, id } as SitePopup;
}

function blankAnnouncement(): Partial<SitePopup> {
  return {
    kind: "announcement",
    name: "",
    eyebrow: "",
    title: "",
    message: "",
    imageUrl: "",
    ctaLabel: "",
    ctaUrl: "",
    dismissLabel: "Close",
    whatsapp: "",
    layout: "modal",
    includePaths: [],
    excludePaths: [],
    liveOnly: false,
    delaySeconds: 5,
    frequency: "once-per-session",
    frequencyDays: 7,
    startsAt: "",
    endsAt: "",
    priority: 0,
  };
}

/**
 * All pop-ups. The three built-ins are written to Firestore the first time
 * (and only then), so they can be edited from the admin.
 */
export async function listPopups(): Promise<SitePopup[]> {
  const db = getAdminDb();
  const [snap, meta] = await Promise.all([
    db.collection(COLLECTION).get(),
    db.collection(META.collection).doc(META.id).get(),
  ]);
  let popups = snap.docs.map((d) => fromDoc(d.id, d.data() as Partial<SitePopup>));

  if (!meta.exists || !meta.get("seeded")) {
    const now = new Date().toISOString();
    const missing = BUILT_IN_POPUPS.filter((b) => !popups.some((p) => p.id === b.id));
    await Promise.all(
      missing.map(({ id, ...rest }) =>
        db.collection(COLLECTION).doc(id).set({ ...rest, createdAt: now, updatedAt: now }),
      ),
    );
    await db.collection(META.collection).doc(META.id).set({ seeded: true, seededAt: now }, { merge: true });
    popups = [...popups, ...missing.map((p) => ({ ...p, createdAt: now, updatedAt: now }))];
  }
  return popups.sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
}

export async function createPopup(input: SitePopupInput): Promise<SitePopup> {
  const now = new Date().toISOString();
  const ref = await getAdminDb()
    .collection(COLLECTION)
    .add({ ...input, kind: "announcement", createdAt: now, updatedAt: now });
  return { ...input, kind: "announcement", id: ref.id, createdAt: now, updatedAt: now };
}

export async function updatePopup(id: string, input: SitePopupInput): Promise<void> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new Error("not-found");
  // A pop-up's kind never changes (a built-in stays a built-in).
  const kind = (existing.get("kind") as SitePopup["kind"]) ?? input.kind;
  await ref.update({ ...input, kind, updatedAt: new Date().toISOString() });
}

export async function deletePopup(id: string): Promise<void> {
  if (BUILT_IN_IDS.has(id)) throw new Error("built-in");
  await getAdminDb().collection(COLLECTION).doc(id).delete();
}
