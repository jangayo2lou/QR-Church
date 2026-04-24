export function manilaDateKey(inputDate = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(inputDate);
}

export function nowIso() {
  return new Date().toISOString();
}
