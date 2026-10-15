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
