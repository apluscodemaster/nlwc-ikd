export type ChurchEvent = {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  time: string;
  location: string;
  category: string;
  recurrence: string;
  icon: string; // emoji
};

/**
 * Generate the next occurrence of a specific weekday from today.
 */
function getNextWeekday(dayOfWeek: number, hour: number, minute: number): Date {
  const now = new Date();
  const result = new Date(now);
  const currentDay = now.getDay();
  let daysUntil = dayOfWeek - currentDay;

  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) {
    // If it's today, check if the event time has already passed
    const eventTimeToday = new Date(now);
    eventTimeToday.setHours(hour, minute, 0, 0);
    if (now > eventTimeToday) daysUntil = 7;
  }

  result.setDate(result.getDate() + daysUntil);
  result.setHours(hour, minute, 0, 0);
  return result;
}

/**
 * Get the second Saturday of a given month/year.
 */
function getSecondSaturday(year: number, month: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstSaturday = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  const daysUntilSat = (6 - dayOfWeek + 7) % 7;
  firstSaturday.setDate(1 + daysUntilSat);
  const secondSaturday = new Date(firstSaturday);
  secondSaturday.setDate(firstSaturday.getDate() + 7);
  secondSaturday.setHours(12, 0, 0, 0);
  return secondSaturday;
}

/**
 * Get all upcoming events dynamically based on the current date.
 * Events are always forward-looking.
 */
export function getUpcomingEvents(): ChurchEvent[] {
  const now = new Date();
  const events: ChurchEvent[] = [];

  // --- 1. Sunday Service ---
  const nextSunday = getNextWeekday(0, 8, 0);
  events.push({
    id: "sunday-service",
    title: "Sunday Worship Service",
    description:
      "Join us for an uplifting morning of worship and life-transforming teaching.",
    date: nextSunday,
    time: "8:00 AM",
    location: "Church Auditorium, Ikorodu",
    category: "Worship",
    recurrence: "Every Sunday",
    icon: "⛪",
  });

  // --- 2. Prayer Meeting (Wednesday) ---
  const nextWednesday = getNextWeekday(3, 6, 0);
  events.push({
    id: "prayer-meeting",
    title: "Prayer Meeting",
    description:
      "A powerful time of corporate intercession and supplication before the throne of grace.",
    date: nextWednesday,
    time: "6:00 PM",
    location: "Church Auditorium, Ikorodu",
    category: "Prayer",
    recurrence: "Every Wednesday",
    icon: "🙏",
  });

  // --- 3. Bible Study (Friday) ---
  const nextFriday = getNextWeekday(5, 18, 0);
  events.push({
    id: "bible-study",
    title: "Bible Study",
    description:
      "A deep dive into God's word to build your faith and strengthen your walk with Christ.",
    date: nextFriday,
    time: "6:00 PM",
    location: "Church Auditorium, Ikorodu",
    category: "Study",
    recurrence: "Every Friday",
    icon: "📖",
  });

  // --- 4. Sithrah (2nd Saturday of each month) ---
  let sithrahDate = getSecondSaturday(now.getFullYear(), now.getMonth());
  if (sithrahDate <= now) {
    // Move to next month
    const nextMonth = now.getMonth() + 1;
    const year = nextMonth > 11 ? now.getFullYear() + 1 : now.getFullYear();
    sithrahDate = getSecondSaturday(year, nextMonth % 12);
  }

  events.push({
    id: "sithrah",
    title: "Sithrah",
    description:
      "A special monthly time of prayer and spiritual refreshing before the Lord.",
    date: sithrahDate,
    time: "12:00 Noon",
    location: "Church Auditorium, Ikorodu",
    category: "Special",
    recurrence: "Every 2nd Saturday",
    icon: "🕊️",
  });

  // Sithrah Preparatory Prayer (Thursday before Sithrah)
  const sithrahThursday = new Date(sithrahDate);
  sithrahThursday.setDate(sithrahDate.getDate() - 2);
  sithrahThursday.setHours(18, 0, 0, 0);
  if (sithrahThursday > now) {
    events.push({
      id: "sithrah-prep-thu",
      title: "Sithrah Preparatory Prayer",
      description:
        "Prayer meeting in preparation for the upcoming Sithrah Saturday.",
      date: sithrahThursday,
      time: "6:00 PM",
      location: "Church Auditorium, Ikorodu",
      category: "Prayer",
      recurrence: "Thursday before Sithrah",
      icon: "🔥",
    });
  }

  // Sithrah Preparatory Prayer (Friday before Sithrah)
  const sithrahFriday = new Date(sithrahDate);
  sithrahFriday.setDate(sithrahDate.getDate() - 1);
  sithrahFriday.setHours(18, 0, 0, 0);
  if (sithrahFriday > now) {
    events.push({
      id: "sithrah-prep-fri",
      title: "Sithrah Preparatory Prayer",
      description:
        "Continuing prayer meeting in preparation for the upcoming Sithrah Saturday.",
      date: sithrahFriday,
      time: "6:00 PM",
      location: "Church Auditorium, Ikorodu",
      category: "Prayer",
      recurrence: "Friday before Sithrah",
      icon: "🔥",
    });
  }

  // --- 5. Season of the Spirit (All Sundays in Feb & 1st Sunday in March) ---
  const currentYear = now.getFullYear();
  // Check if we're in February or early March window
  const febSundays: Date[] = [];
  const checkDate = new Date(currentYear, 1, 1); // Feb 1
  while (checkDate.getMonth() === 1) {
    if (checkDate.getDay() === 0) {
      const d = new Date(checkDate);
      d.setHours(8, 0, 0, 0);
      febSundays.push(d);
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  // 1st Sunday of March
  const marchFirst = new Date(currentYear, 2, 1);
  while (marchFirst.getDay() !== 0) {
    marchFirst.setDate(marchFirst.getDate() + 1);
  }
  marchFirst.setHours(8, 0, 0, 0);

  const sosSundays = [...febSundays, marchFirst];
  const futureSOSSundays = sosSundays.filter((d) => d > now);

  if (futureSOSSundays.length > 0) {
    // Add the next upcoming SOS Sunday
    events.push({
      id: "season-of-the-spirit",
      title: "Season of the Spirit",
      description:
        "Annual conference — a special season of the outpouring of the Holy Spirit.",
      date: futureSOSSundays[0],
      endDate: sosSundays[sosSundays.length - 1],
      time: "8:00 AM",
      location: "Church Auditorium, Ikorodu",
      category: "Conference",
      recurrence: `${futureSOSSundays.length} Sunday${futureSOSSundays.length > 1 ? "s" : ""} remaining`,
      icon: "✨",
    });
  }

  // Sort by date (nearest first)
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return events;
}

/**
 * Generate an .ics calendar string for a single event.
 */
export function generateICS(event: ChurchEvent): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const formatICSDate = (d: Date): string => {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const start = formatICSDate(event.date);
  const endDate = new Date(event.date);
  endDate.setHours(endDate.getHours() + 2); // Default 2hr duration
  const end = formatICSDate(endDate);

  const uid = `${event.id}-${start}@nlwc-ikorodu`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NLWC Ikorodu//Service Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${event.title} starts in 30 minutes`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
