export function nextStatus(current) {
  switch (current) {
    case "pending": return "in_progress";
    case "in_progress": return "done";
    case "done": return "done";
    default: return "pending";
  }
}
