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
    // Keep today shown until midnight — this allows the "Now Live" window.
    // Only move to next week if we're past midnight (i.e., the full day has ended).
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    const eventTimeToday = new Date(now);
    eventTimeToday.setHours(hour, minute, 0, 0);
    // If the service time has passed AND we're past midnight, jump to next week.
    // Otherwise keep daysUntil = 0 so the event remains visible today.
    if (now > midnight) daysUntil = 7;
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
  const nextWednesday = getNextWeekday(3, 18, 0);
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
  // NOTE: Bible Study cancelled on April 3 (Teenager's Retreat) and
  //       April 10 (Special Meeting with Pastor Tosin Gabriel).
  const nextFriday = getNextWeekday(5, 18, 0);
  const skipBibleStudyDates = [
    new Date(2026, 3, 3).toDateString(), // April 3 — retreat
    new Date(2026, 3, 10).toDateString(), // April 10 — special meeting
  ];

  let bibleStudyDate = nextFriday;
  // If the next Friday is a skip date, advance to the Friday after
  while (skipBibleStudyDates.includes(bibleStudyDate.toDateString())) {
    bibleStudyDate = new Date(bibleStudyDate);
    bibleStudyDate.setDate(bibleStudyDate.getDate() + 7);
    bibleStudyDate.setHours(18, 0, 0, 0);
  }

  events.push({
    id: "bible-study",
    title: "Bible Study",
    description:
      "A deep dive into God's word to build your faith and strengthen your walk with Christ.",
    date: bibleStudyDate,
    time: "6:00 PM",
    location: "Church Auditorium, Ikorodu",
    category: "Study",
    recurrence: "Every Friday",
    icon: "📖",
  });

  // --- 4. Sithrah (2nd Saturday of each month) ---
  // NOTE: April 2026 Sithrah is cancelled — replaced by Special Meeting
  // with Pastor Tosin Gabriel (April 9-12). Next Sithrah is May 2026.
  let sithrahDate = getSecondSaturday(now.getFullYear(), now.getMonth());
  if (sithrahDate <= now) {
    // Move to next month
    const nextMonth = now.getMonth() + 1;
    const year = nextMonth > 11 ? now.getFullYear() + 1 : now.getFullYear();
    sithrahDate = getSecondSaturday(year, nextMonth % 12);
  }

  // Skip April 2026 Sithrah — special meeting that month instead
  if (
    sithrahDate.getFullYear() === 2026 &&
    sithrahDate.getMonth() === 3 // April = month 3 (0-indexed)
  ) {
    sithrahDate = getSecondSaturday(2026, 4); // Jump to May 2026
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
      location: "Online",
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
      location: "Online",
      category: "Prayer",
      recurrence: "Friday before Sithrah",
      icon: "🔥",
    });
  }

  // --- 4b. Special Meeting with Pastor Tosin Gabriel (April 9-12, 2026) ---
  const specialMeetingStart = new Date(2026, 3, 9, 18, 0, 0, 0); // April 9
  const specialMeetingEnd = new Date(2026, 3, 12, 14, 0, 0, 0); // April 12
  if (specialMeetingEnd > now) {
    events.push({
      id: "special-meeting-apr-2026",
      title: "Special Meeting with Pastor Tosin Gabriel",
      description:
        "A powerful time of ministry with Pastor Tosin Gabriel. Come expectant for a life-changing encounter with God.",
      date: specialMeetingStart,
      endDate: specialMeetingEnd,
      time: "6:00 PM",
      location: "Church Auditorium, Ikorodu",
      category: "Special",
      recurrence: "April 9–12, 2026",
      icon: "🔥",
    });
  }

  // --- 4c. Teenager's Retreat (April 2-5, 2026) ---
  const teenRetreatStart = new Date(2026, 3, 2, 18, 0, 0, 0); // April 2, 6pm
  const teenRetreatEnd = new Date(2026, 3, 5, 16, 0, 0, 0); // April 5
  if (teenRetreatEnd > now) {
    events.push({
      id: "teen-retreat-apr-2026",
      title: "Teenager's Retreat",
      description:
        "A special retreat for teenagers — evening session today at 5 PM; morning (9 AM) and evening (5 PM) sessions tomorrow. All teenagers are invited!",
      date: teenRetreatStart,
      endDate: teenRetreatEnd,
      time: "5:00 PM",
      location: "Church Auditorium, Ikorodu",
      category: "Youth",
      recurrence: "April 2–5, 2026",
      icon: "🎯",
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
 * Generate a Google Calendar URL to create an event directly in the user's calendar.
 */
export function generateGoogleCalendarUrl(event: ChurchEvent): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const formatGCalDate = (d: Date): string => {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const start = formatGCalDate(event.date);
  const endDate = new Date(event.date);
  endDate.setHours(endDate.getHours() + 2); // Default 2hr duration
  const end = formatGCalDate(endDate);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.description}\n\n${event.recurrence}\n\nNLWC Ikorodu`,
    location: event.location,
    trp: "false",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
