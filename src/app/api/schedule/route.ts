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
    label: "Sunday Service",
    description: "",
    imageUrl: "",
    active: true,
  },
  {
    dayOfWeek: 3,
    startHour: 18,
    endHour: 21,
    label: "Prayer Meeting",
    description: "",
    imageUrl: "",
    active: true,
  },
  {
    dayOfWeek: 5,
    startHour: 18,
    endHour: 22,
    label: "Bible Study",
    description: "",
    imageUrl: "",
    active: true,
  },
];

// ── GET: Fetch all schedules (public) — auto-seeds defaults if empty ──
export async function GET() {
  try {
    const [fetchedRecurring, special] = await Promise.all([
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

    return NextResponse.json({ recurring, special });
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

    if (data.startHour >= data.endHour) {
      return NextResponse.json(
        { error: "Start hour must be before end hour" },
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
        label: data.label,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
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
        label: data.label,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
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
      if (data.startHour >= data.endHour) {
        return NextResponse.json(
          { error: "Start hour must be before end hour" },
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
