import { CalendarMath } from "vue-simple-calendar"

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart
}

export function isAllDayEvent(item) {
  const normalized = CalendarMath.normalizeItem(item)
  const start = normalized.startDate
  const end = normalized.endDate
  const startsAtMidnight = start.getHours() === 0 && start.getMinutes() === 0
  const endsAtMidnight = end.getHours() === 0 && end.getMinutes() === 0
  const spansAtLeastOneDay = CalendarMath.dayDiff(start, end) >= 1
  return startsAtMidnight && endsAtMidnight && spansAtLeastOneDay
}

export function beginningOfWeekDate(date) {
  return CalendarMath.beginningOfWeek(CalendarMath.dateOnly(date), 0)
}

export function createEventDate(y, m, d, h = 0, min = 0) {
  const dt = new Date(y, m, d, h, min)
  dt.setSeconds(0, 0)
  return dt
}
