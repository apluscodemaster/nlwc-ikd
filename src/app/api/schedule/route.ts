import { NextRequest, NextResponse } from "next/server";
import {
  getRecurringServices,
  createRecurringService,
  updateRecurringService,
  deleteRecurringService,
  getSpecialServices,
  createSpecialService,
  updateSpecialService,
  deleteSpecialService,
} from "@/lib/scheduleService";

// ── Default recurring services (seeded when Firestore is empty) ──
const DEFAULT_RECURRING = [
  {
    dayOfWeek: 0,
    startHour: 8,
    endHour: 15,
    label: "Sunday Worship Service",
    description:
      "Join us for an uplifting morning of worship and life-transforming teaching.",
    imageUrl: "",
    location: "Church Auditorium, Ikorodu",
    category: "Worship",
    icon: "⛪",
    recurrenceLabel: "Every Sunday",
    active: true,
  },
  {
    dayOfWeek: 3,
    startHour: 18,
    endHour: 21,
    label: "Prayer Meeting",
    description:
      "A powerful time of corporate intercession and supplication before the throne of grace.",
    imageUrl: "",
    location: "Church Auditorium, Ikorodu",
    category: "Prayer",
    icon: "🙏",
    recurrenceLabel: "Every Wednesday",
    active: true,
  },
  {
    dayOfWeek: 5,
    startHour: 18,
    endHour: 22,
    label: "Bible Study",
    description:
      "A deep dive into God's word to build your faith and strengthen your walk with Christ.",
    imageUrl: "",
    location: "Church Auditorium, Ikorodu",
    category: "Study",
    icon: "📖",
    recurrenceLabel: "Every Friday",
    active: true,
  },
];

// ── Compute default special events based on current date ──
function getDefaultSpecialEvents() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function getSecondSaturday(year: number, month: number): Date {
    const firstDay = new Date(year, month, 1);
    const daysUntilSat = (6 - firstDay.getDay() + 7) % 7;
    const firstSat = new Date(year, month, 1 + daysUntilSat);
    const secondSat = new Date(firstSat);
    secondSat.setDate(firstSat.getDate() + 7);
    secondSat.setHours(12, 0, 0, 0);
    return secondSat;
  }

  const events: Array<{
    date: string;
    startHour: number;
    endHour: number;
    label: string;
    description: string;
    imageUrl: string;
    location: string;
    category: string;
    icon: string;
    recurrenceLabel: string;
    active: boolean;
  }> = [];

  // Sithrah — 2nd Saturday of current or next month
  let sithrahDate = getSecondSaturday(now.getFullYear(), now.getMonth());
  if (sithrahDate <= now) {
    const nm = now.getMonth() + 1;
    const yr = nm > 11 ? now.getFullYear() + 1 : now.getFullYear();
    sithrahDate = getSecondSaturday(yr, nm % 12);
  }

  events.push({
    date: fmt(sithrahDate),
    startHour: 12,
    endHour: 18,
    label: "Sithrah",
    description:
      "A special monthly time of prayer and spiritual refreshing before the Lord.",
    imageUrl: "",
    location: "Church Auditorium, Ikorodu",
    category: "Special",
    icon: "🕊️",
    recurrenceLabel: "Every 2nd Saturday",
    active: true,
  });

  // Sithrah Preparatory Prayer — Thursday before Sithrah
  const sithrahThu = new Date(sithrahDate);
  sithrahThu.setDate(sithrahDate.getDate() - 2);
  sithrahThu.setHours(18, 0, 0, 0);
  if (sithrahThu > now) {
    events.push({
      date: fmt(sithrahThu),
      startHour: 18,
      endHour: 21,
      label: "Sithrah Preparatory Prayer",
      description:
        "Prayer meeting in preparation for the upcoming Sithrah Saturday.",
      imageUrl: "",
      location: "Online",
      category: "Prayer",
      icon: "🔥",
      recurrenceLabel: "Thursday before Sithrah",
      active: true,
    });
  }

  // Sithrah Preparatory Prayer — Friday before Sithrah
  const sithrahFri = new Date(sithrahDate);
  sithrahFri.setDate(sithrahDate.getDate() - 1);
  sithrahFri.setHours(18, 0, 0, 0);
  if (sithrahFri > now) {
    events.push({
      date: fmt(sithrahFri),
      startHour: 18,
      endHour: 21,
      label: "Sithrah Preparatory Prayer",
      description:
        "Continuing prayer meeting in preparation for the upcoming Sithrah Saturday.",
      imageUrl: "",
      location: "Online",
      category: "Prayer",
      icon: "🔥",
      recurrenceLabel: "Friday before Sithrah",
      active: true,
    });
  }

  // Season of the Spirit — Feb Sundays + 1st Sunday of March (if upcoming)
  const year = now.getFullYear();
  const febSundays: Date[] = [];
  const d = new Date(year, 1, 1);
  while (d.getMonth() === 1) {
    if (d.getDay() === 0) febSundays.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  const marchFirst = new Date(year, 2, 1);
  while (marchFirst.getDay() !== 0)
    marchFirst.setDate(marchFirst.getDate() + 1);
  const sosDates = [...febSundays, marchFirst];
  const futureSos = sosDates.filter((s) => s > now);

  for (const sosDate of futureSos) {
    sosDate.setHours(8, 0, 0, 0);
    events.push({
      date: fmt(sosDate),
      startHour: 8,
      endHour: 15,
      label: "Season of the Spirit",
      description:
        "Annual conference — a special season of the outpouring of the Holy Spirit.",
      imageUrl: "",
      location: "Church Auditorium, Ikorodu",
      category: "Conference",
      icon: "✨",
      recurrenceLabel: `${futureSos.length} Sunday${futureSos.length > 1 ? "s" : ""} remaining`,
      active: true,
    });
  }

  return events;
}

// ── GET: Fetch all schedules (public) — auto-seeds defaults if empty ──
export async function GET() {
  try {
    const [fetchedRecurring, fetchedSpecial] = await Promise.all([
      getRecurringServices(),
      getSpecialServices(),
    ]);

    // Auto-seed default recurring services if Firestore is empty
    let recurring = fetchedRecurring;
    if (recurring.length === 0) {
      const seeded = await Promise.all(
        DEFAULT_RECURRING.map((svc) => createRecurringService(svc)),
      );
      recurring = seeded;
    }

    // Auto-seed default special events if Firestore is empty
    let special = fetchedSpecial;
    if (special.length === 0) {
      const defaults = getDefaultSpecialEvents();
      if (defaults.length > 0) {
        const seeded = await Promise.all(
          defaults.map((evt) => createSpecialService(evt)),
        );
        special = seeded;
      }
    }

    return NextResponse.json(
      { recurring, special },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}

// ── POST: Create a schedule entry ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ...data } = body;

    if (
      !type ||
      !data.label ||
      data.startHour === undefined ||
      data.endHour === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields: type, label, startHour, endHour" },
        { status: 400 },
      );
    }

    if (
      data.startHour < 0 ||
      data.startHour > 23 ||
      data.endHour < 0 ||
      data.endHour > 24
    ) {
      return NextResponse.json(
        { error: "Hours must be between 0-23 (start) and 0-24 (end)" },
        { status: 400 },
      );
    }

    if (!data.endsNextDay && data.startHour >= data.endHour) {
      return NextResponse.json(
        { error: "Start hour must be before end hour (or enable 'Ends next day')" },
        { status: 400 },
      );
    }

    if (type === "recurring") {
      if (
        data.dayOfWeek === undefined ||
        data.dayOfWeek < 0 ||
        data.dayOfWeek > 6
      ) {
        return NextResponse.json(
          { error: "dayOfWeek is required and must be 0-6" },
          { status: 400 },
        );
      }
      const result = await createRecurringService({
        dayOfWeek: data.dayOfWeek,
        startHour: data.startHour,
        endHour: data.endHour,
        endsNextDay: data.endsNextDay || false,
        label: data.label,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        location: data.location || "",
        category: data.category || "",
        icon: data.icon || "",
        recurrenceLabel: data.recurrenceLabel || "",
        active: data.active !== false,
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (type === "special") {
      if (!data.date) {
        return NextResponse.json(
          { error: "date is required for special events (YYYY-MM-DD)" },
          { status: 400 },
        );
      }
      const result = await createSpecialService({
        date: data.date,
        startHour: data.startHour,
        endHour: data.endHour,
        endsNextDay: data.endsNextDay || false,
        label: data.label,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        location: data.location || "",
        category: data.category || "",
        icon: data.icon || "",
        recurrenceLabel: data.recurrenceLabel || "",
        active: data.active !== false,
      });
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json(
      { error: 'type must be "recurring" or "special"' },
      { status: 400 },
    );
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule entry" },
      { status: 500 },
    );
  }
}

// ── PUT: Update an existing schedule entry ──
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, ...data } = body;

    if (!type || !id) {
      return NextResponse.json(
        { error: "type and id are required" },
        { status: 400 },
      );
    }

    if (data.startHour !== undefined && data.endHour !== undefined) {
      if (!data.endsNextDay && data.startHour >= data.endHour) {
        return NextResponse.json(
          { error: "Start hour must be before end hour (or enable 'Ends next day')" },
          { status: 400 },
        );
      }
    }

    if (type === "recurring") {
      await updateRecurringService(id, data);
    } else if (type === "special") {
      await updateSpecialService(id, data);
    } else {
      return NextResponse.json(
        { error: 'type must be "recurring" or "special"' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule entry" },
      { status: 500 },
    );
  }
}

// ── DELETE: Remove a schedule entry ──
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "type and id query params are required" },
        { status: 400 },
      );
    }

    if (type === "recurring") {
      await deleteRecurringService(id);
    } else if (type === "special") {
      await deleteSpecialService(id);
    } else {
      return NextResponse.json(
        { error: 'type must be "recurring" or "special"' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule entry" },
      { status: 500 },
    );
  }
}
