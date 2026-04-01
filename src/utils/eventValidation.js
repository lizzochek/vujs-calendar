export function validateEventForSave(ev) {
  const title = (ev?.title ?? "").trim()
  if (title.length < 3 || title.length > 30) {
    return {
      ok: false,
      message: "Event name must be between 3 and 30 characters.",
    }
  }
  const start = ev.startDate instanceof Date ? ev.startDate : new Date(ev.startDate)
  const end = ev.endDate instanceof Date ? ev.endDate : new Date(ev.endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      ok: false,
      message: "Start and end date and time are required.",
    }
  }
  if (start.getTime() >= end.getTime()) {
    return {
      ok: false,
      message: "Start date and time must be before end date and time.",
    }
  }
  return { ok: true }
}
