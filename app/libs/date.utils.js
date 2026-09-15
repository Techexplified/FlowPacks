/**
 * Formats an ISO date string into human-friendly relative format (e.g. "Today, 9:14 AM", "Mon, 9:00 AM").
 */
export function formatActivityDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Today, ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  const daysDiff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    return `${weekday}, ${timeStr}`;
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
