<script setup>
import { computed, ref } from "vue"
import { CalendarMath, CalendarView } from "vue-simple-calendar"
import Modal from "./components/Modal.vue"
import "vue-simple-calendar/dist/vue-simple-calendar.css"
import "vue-simple-calendar/dist/css/default.css"
import "./assets/tailwind.css"

const DEFAULT_EVENT_COLOR = "#2f80ed"

function eventBorderColor(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || "").trim())
  if (!m) return "#2b75d8"
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const d = 0.88
  return `rgb(${Math.round(r * d)},${Math.round(g * d)},${Math.round(b * d)})`
}

function eventBlockStyle(color) {
  const bg = color || DEFAULT_EVENT_COLOR
  return {
    backgroundColor: bg,
    borderColor: eventBorderColor(bg),
  }
}

function calendarItemStyleString(item) {
  const bg = item.color || DEFAULT_EVENT_COLOR
  return `background-color: ${bg}; border-color: ${eventBorderColor(bg)};`
}

function weekTimedEventLayoutStyle(event) {
  return {
    ...eventBlockStyle(event.color),
    top: `${event._top}px`,
    height: `${event._height}px`,
    left: `calc(${event._col} * (100% / ${event._cols}) + 2px)`,
    width: `calc((100% / ${event._cols}) - 4px)`,
    zIndex: 10 + event._col,
  }
}

function weekSpanLayoutStyle(span) {
  return {
    ...eventBlockStyle(span.color),
    left: `calc(${(span._startIndex * 100) / 7}% + 2px)`,
    width: `calc(${((span._endIndex - span._startIndex + 1) * 100) / 7}% - 4px)`,
    top: `${span._lane * 26 + 4}px`,
  }
}

const showDate = ref(new Date())
const activeView = ref("month")

const now = new Date()
const year = now.getFullYear()
const month = now.getMonth()

function eventDate(y, m, d, h = 0, min = 0) {
  const dt = new Date(y, m, d, h, min)
  dt.setSeconds(0, 0)
  return dt
}

const calendarItems = ref([
  {
    id: "e1",
    startDate: eventDate(year, month, 4, 14, 0),
    endDate: eventDate(year, month, 4, 15, 30),
    title: "Morning Meeting",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#2f80ed",
  },
  {
    id: "e2",
    startDate: eventDate(year, month, 4, 14, 0),
    endDate: eventDate(year, month, 4, 15, 0),
    title: "Project Discussion",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#9b59b6",
  },
  {
    id: "e3",
    startDate: eventDate(year, month, 5, 8, 30),
    endDate: eventDate(year, month, 5, 9, 30),
    title: "Coffee with Client",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#27ae60",
  },
  {
    id: "e4",
    startDate: eventDate(year, month, 14, 12, 15),
    endDate: eventDate(year, month, 14, 13, 0),
    title: "Lunch Break",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#f39c12",
  },
  {
    id: "e5",
    startDate: eventDate(year, month, 20, 16, 0),
    endDate: eventDate(year, month, 20, 17, 30),
    title: "Afternoon Review",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#1abc9c",
  },
  {
    id: "e6",
    startDate: eventDate(year, month, 28, 10, 0),
    endDate: eventDate(year, month, 28, 10, 45),
    title: "Stand-up",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#e74c3c",
  },
  {
    id: "e7",
    startDate: eventDate(year, month, 29, 18, 0),
    endDate: eventDate(year, month, 29, 20, 0),
    title: "Team Dinner",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#e91e8c",
  },
  {
    id: "e8",
    startDate: eventDate(year, month, 1, 0, 0),
    endDate: eventDate(year, month, 2, 0, 0),
    title: "Day off",
    description: "No work today.",
    color: "#607d8b",
  },
])

const sortedCalendarItems = computed(() => {
  return [...calendarItems.value].sort((a, b) => {
    const aAllDay = isAllDayEvent(a)
    const bAllDay = isAllDayEvent(b)
    if (aAllDay !== bAllDay) return aAllDay ? -1 : 1

    const aNorm = CalendarMath.normalizeItem(a)
    const bNorm = CalendarMath.normalizeItem(b)
    const aStart = aNorm.startDate.getTime()
    const bStart = bNorm.startDate.getTime()
    if (aStart !== bStart) return aStart - bStart
    return aNorm.endDate.getTime() - bNorm.endDate.getTime()
  })
})

const itemsForCalendarView = computed(() =>
  sortedCalendarItems.value.map((item) => ({
    ...item,
    style: calendarItemStyleString(item),
  })),
)

function toCurrentPeriod(date) {
  showDate.value = new Date(date)
}

function setView(view) {
  if (view === "agenda") return
  activeView.value = view
}

const currentPeriodLabel = computed(() => {
  if (activeView.value === "week") return weekPeriodLabel.value
  if (activeView.value === "day") {
    return showDate.value.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  return showDate.value.toLocaleDateString(undefined, { month: "long", year: "numeric" })
})

function movePeriod(delta) {
  if (activeView.value === "day") {
    toCurrentPeriod(CalendarMath.addDays(showDate.value, delta))
    return
  }
  toCurrentPeriod(CalendarMath.incrementPeriod(showDate.value, activeView.value, delta))
}

const GRID_START_MINUTES = 12 * 60
const GRID_END_MINUTES = 23 * 60
const SLOT_MINUTES = 60
const SLOT_COUNT = (GRID_END_MINUTES - GRID_START_MINUTES) / SLOT_MINUTES
const SLOT_HEIGHT = 54
const PX_PER_MINUTE = SLOT_HEIGHT / SLOT_MINUTES
const CURRENT_TIME_LINE_OFFSET_PX = 7
const TIME_COL_WIDTH = 86

const timeLabels = computed(() =>
  Array.from({ length: SLOT_COUNT }, (_, i) => {
    const total = GRID_START_MINUTES + i * SLOT_MINUTES
    const h = Math.floor(total / 60)
    const m = total % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }),
)

function beginningOfWeek(date) {
  return CalendarMath.beginningOfWeek(CalendarMath.dateOnly(date), 0)
}

const weekStart = computed(() => beginningOfWeek(showDate.value))
const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => CalendarMath.addDays(weekStart.value, i)),
)

const weekPeriodLabel = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[6]
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`
})

const weekAllDaySpans = computed(() => {
  const spans = []
  sortedCalendarItems.value.forEach((item) => {
    if (!isAllDayEvent(item)) return
    const normalized = CalendarMath.normalizeItem(item)
    const startDateOnly = CalendarMath.dateOnly(normalized.startDate)
    const endDateOnly = CalendarMath.dateOnly(normalized.endDate)
    const spanDays = Math.max(1, CalendarMath.dayDiff(startDateOnly, endDateOnly) + 1)
    const rawStartIndex = CalendarMath.dayDiff(weekStart.value, startDateOnly)
    const rawEndIndex = rawStartIndex + spanDays - 1
    const startIndex = Math.max(0, rawStartIndex)
    const endIndex = Math.min(6, rawEndIndex)
    if (endIndex < 0 || startIndex > 6 || startIndex > endIndex) return
    spans.push({
      ...item,
      _startIndex: startIndex,
      _endIndex: endIndex,
      _lane: 0,
    })
  })

  spans.sort((a, b) => a._startIndex - b._startIndex || a._endIndex - b._endIndex)
  const laneEnds = []
  spans.forEach((span) => {
    let lane = 0
    while (laneEnds[lane] !== undefined && laneEnds[lane] >= span._startIndex) lane++
    span._lane = lane
    laneEnds[lane] = span._endIndex
  })

  return spans
})

const allDayRowHeight = computed(() => {
  if (weekAllDaySpans.value.length === 0) return SLOT_HEIGHT
  const maxLane = Math.max(...weekAllDaySpans.value.map((s) => s._lane))
  return Math.max(SLOT_HEIGHT, (maxLane + 1) * 26 + 6)
})

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart
}

function isToday(day) {
  return CalendarMath.isSameDate(day, nowTick.value)
}

function isAllDayEvent(item) {
  const normalized = CalendarMath.normalizeItem(item)
  const start = normalized.startDate
  const end = normalized.endDate
  const startsAtMidnight = start.getHours() === 0 && start.getMinutes() === 0
  const endsAtMidnight = end.getHours() === 0 && end.getMinutes() === 0
  const spansAtLeastOneDay = CalendarMath.dayDiff(start, end) >= 1
  return startsAtMidnight && endsAtMidnight && spansAtLeastOneDay
}

const weekColumns = computed(() => {
  return weekDays.value.map((day) => {
    const dayStart = CalendarMath.dateOnly(day)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    const dayStartMs = dayStart.getTime()
    const dayEndMs = dayEnd.getTime()

    const allDayEvents = []
    const timedEvents = []

    sortedCalendarItems.value.forEach((item) => {
      const normalized = CalendarMath.normalizeItem(item)
      const eventStart = normalized.startDate.getTime()
      const eventEnd = normalized.endDate.getTime()
      if (!overlaps(eventStart, eventEnd, dayStartMs, dayEndMs + 1)) return

      if (isAllDayEvent(item)) {
        return
      }

      const localStart = new Date(Math.max(eventStart, dayStartMs))
      const localEnd = new Date(Math.min(eventEnd, dayEndMs))
      const startMinutesFromMidnight =
        localStart.getHours() * 60 +
        localStart.getMinutes() +
        localStart.getSeconds() / 60 +
        localStart.getMilliseconds() / 60000
      const endMinutesFromMidnight =
        localEnd.getHours() * 60 +
        localEnd.getMinutes() +
        localEnd.getSeconds() / 60 +
        localEnd.getMilliseconds() / 60000
      const durationMinutes = Math.max(endMinutesFromMidnight - startMinutesFromMidnight, 1 / 60)
      const visStart = Math.max(startMinutesFromMidnight, GRID_START_MINUTES)
      const visEnd = Math.min(endMinutesFromMidnight, GRID_END_MINUTES)
      if (visEnd <= GRID_START_MINUTES || visStart >= GRID_END_MINUTES) return

      const top = (visStart - GRID_START_MINUTES) * PX_PER_MINUTE
      const height = Math.max((visEnd - visStart) * PX_PER_MINUTE, 4)
      timedEvents.push({
        ...item,
        _top: top,
        _height: height,
        _isShort: durationMinutes <= 45,
        _startMinutes: startMinutesFromMidnight,
        _endMinutes: endMinutesFromMidnight,
      })
    })

    timedEvents.sort((a, b) => a._startMinutes - b._startMinutes || b._endMinutes - a._endMinutes)

    const assignGroupColumns = (group) => {
      const activeCols = []
      let maxCols = 1
      group.forEach((event) => {
        for (let i = activeCols.length - 1; i >= 0; i--) {
          if (activeCols[i].endMinutes <= event._startMinutes) activeCols.splice(i, 1)
        }
        const used = new Set(activeCols.map((a) => a.col))
        let col = 0
        while (used.has(col)) col++
        event._col = col
        activeCols.push({ col, endMinutes: event._endMinutes })
        maxCols = Math.max(maxCols, activeCols.length)
      })
      group.forEach((event) => {
        event._cols = maxCols
      })
    }

    let group = []
    let groupEnd = -1
    timedEvents.forEach((event) => {
      if (group.length === 0 || event._startMinutes < groupEnd) {
        group.push(event)
        groupEnd = Math.max(groupEnd, event._endMinutes)
      } else {
        assignGroupColumns(group)
        group = [event]
        groupEnd = event._endMinutes
      }
    })
    if (group.length > 0) assignGroupColumns(group)

    return { day, allDayEvents, timedEvents }
  })
})

const dayColumn = computed(() => {
  const day = CalendarMath.dateOnly(showDate.value)
  const dayEnd = new Date(day)
  dayEnd.setHours(23, 59, 59, 999)
  const dayStartMs = day.getTime()
  const dayEndMs = dayEnd.getTime()
  const allDayEvents = []
  const timedEvents = []

  sortedCalendarItems.value.forEach((item) => {
    const normalized = CalendarMath.normalizeItem(item)
    const eventStart = normalized.startDate.getTime()
    const eventEnd = normalized.endDate.getTime()
    if (!overlaps(eventStart, eventEnd, dayStartMs, dayEndMs + 1)) return

    if (isAllDayEvent(item)) {
      allDayEvents.push(item)
      return
    }

    const localStart = new Date(Math.max(eventStart, dayStartMs))
    const localEnd = new Date(Math.min(eventEnd, dayEndMs))
    const startMinutesFromMidnight =
      localStart.getHours() * 60 +
      localStart.getMinutes() +
      localStart.getSeconds() / 60 +
      localStart.getMilliseconds() / 60000
    const endMinutesFromMidnight =
      localEnd.getHours() * 60 +
      localEnd.getMinutes() +
      localEnd.getSeconds() / 60 +
      localEnd.getMilliseconds() / 60000
    const durationMinutes = Math.max(endMinutesFromMidnight - startMinutesFromMidnight, 1 / 60)
    const visStart = Math.max(startMinutesFromMidnight, GRID_START_MINUTES)
    const visEnd = Math.min(endMinutesFromMidnight, GRID_END_MINUTES)
    if (visEnd <= GRID_START_MINUTES || visStart >= GRID_END_MINUTES) return

    const top = (visStart - GRID_START_MINUTES) * PX_PER_MINUTE
    const height = Math.max((visEnd - visStart) * PX_PER_MINUTE, 4)
    timedEvents.push({
      ...item,
      _top: top,
      _height: height,
      _isShort: durationMinutes <= 45,
      _startMinutes: startMinutesFromMidnight,
      _endMinutes: endMinutesFromMidnight,
    })
  })

  timedEvents.sort((a, b) => a._startMinutes - b._startMinutes || b._endMinutes - a._endMinutes)
  const active = []
  let maxCols = 1
  timedEvents.forEach((event) => {
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].endMinutes <= event._startMinutes) active.splice(i, 1)
    }
    const used = new Set(active.map((a) => a.col))
    let col = 0
    while (used.has(col)) col++
    event._col = col
    active.push({ col, endMinutes: event._endMinutes })
    maxCols = Math.max(maxCols, active.length)
  })
  timedEvents.forEach((event) => {
    event._cols = maxCols
  })

  return { day, allDayEvents, timedEvents }
})

const dayViewHeaderLabel = computed(() => {
  const d = dayColumn.value.day
  const wd = d.toLocaleDateString("en-US", { weekday: "short" })
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${wd} ${mm}/${dd}`
})

function handleItemDrop(calendarItem, date) {
  if (!calendarItem || !date) return
  const id = calendarItem.id ?? calendarItem.originalItem?.id
  const oldStart =
    calendarItem.startDate instanceof Date
      ? calendarItem.startDate
      : new Date(calendarItem.startDate)
  const oldEnd = calendarItem.endDate
    ? calendarItem.endDate instanceof Date
      ? calendarItem.endDate
      : new Date(calendarItem.endDate)
    : null

  const newStart = new Date(date)
  newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), oldStart.getSeconds(), 0)
  let newEnd = null
  if (oldEnd) {
    const diffMs = oldEnd - oldStart
    newEnd = new Date(newStart.getTime() + diffMs)
  }

  const idx = calendarItems.value.findIndex((item) => item.id === id)
  if (idx === -1) return
  const updated = { ...calendarItems.value[idx], startDate: newStart }
  if (newEnd) updated.endDate = newEnd
  else delete updated.endDate
  calendarItems.value.splice(idx, 1, updated)
}

function onWeekDayDragStart(e, item) {
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/plain", String(item.id))
}

function roundToStepMinutes(minutes, step) {
  const r = Math.round(minutes / step) * step
  return Math.max(GRID_START_MINUTES, Math.min(GRID_END_MINUTES - 1, r))
}

function dayFromWeekOrDayGridPoint(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  const col = el?.closest?.(".day-column")
  if (!col?.dataset?.dayTs) return null
  const ts = Number(col.dataset.dayTs)
  if (Number.isNaN(ts)) return null
  return new Date(ts)
}

function onHourGridDrop(e, dayHint) {
  e.preventDefault()
  e.stopPropagation()
  const id = e.dataTransfer.getData("text/plain")
  if (!id) return
  const idx = calendarItems.value.findIndex((x) => String(x.id) === id)
  if (idx === -1) return
  const stored = calendarItems.value[idx]
  const grid = e.target.closest(".hour-grid")
  if (!grid) return
  const day =
    dayFromWeekOrDayGridPoint(e) || (dayHint instanceof Date ? dayHint : new Date(dayHint))
  if (!day || Number.isNaN(day.getTime())) return
  const rect = grid.getBoundingClientRect()
  const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
  let minutes = GRID_START_MINUTES + y / PX_PER_MINUTE
  minutes = roundToStepMinutes(minutes, 5)
  const norm = CalendarMath.normalizeItem(stored)
  const durationMs = norm.endDate.getTime() - norm.startDate.getTime()
  const dayOnly = CalendarMath.dateOnly(day)
  const newStart = new Date(dayOnly)
  newStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  const newEnd = new Date(newStart.getTime() + durationMs)
  calendarItems.value.splice(idx, 1, { ...stored, startDate: newStart, endDate: newEnd })
}

function onAllDayRowDrop(e, dayHint) {
  e.preventDefault()
  e.stopPropagation()
  const id = e.dataTransfer.getData("text/plain")
  if (!id) return
  const idx = calendarItems.value.findIndex((x) => String(x.id) === id)
  if (idx === -1) return
  const stored = calendarItems.value[idx]
  const day =
    dayFromWeekOrDayGridPoint(e) ||
    (dayHint instanceof Date ? dayHint : dayHint != null ? new Date(dayHint) : null)
  if (!day || Number.isNaN(day.getTime())) return
  const norm = CalendarMath.normalizeItem(stored)
  const durationMs = norm.endDate.getTime() - norm.startDate.getTime()
  const target = CalendarMath.dateOnly(day)
  target.setHours(0, 0, 0, 0)
  if (isAllDayEvent(stored)) {
    const newStart = new Date(target)
    const newEnd = new Date(newStart.getTime() + durationMs)
    calendarItems.value.splice(idx, 1, { ...stored, startDate: newStart, endDate: newEnd })
  } else {
    const newStart = new Date(target)
    const newEnd = CalendarMath.addDays(newStart, 1)
    newEnd.setHours(0, 0, 0, 0)
    calendarItems.value.splice(idx, 1, { ...stored, startDate: newStart, endDate: newEnd })
  }
}

const dayGridHeight = SLOT_COUNT * SLOT_HEIGHT
const nowTick = ref(new Date())

const showCurrentTimeLine = computed(() => {
  if (activeView.value !== "week" && activeView.value !== "day") return false
  const m =
    nowTick.value.getHours() * 60 +
    nowTick.value.getMinutes() +
    nowTick.value.getSeconds() / 60 +
    nowTick.value.getMilliseconds() / 60000
  return m >= GRID_START_MINUTES && m < GRID_END_MINUTES
})

const currentTimeLineTop = computed(() => {
  const nowDate = nowTick.value
  const minutes =
    nowDate.getHours() * 60 +
    nowDate.getMinutes() +
    nowDate.getSeconds() / 60 +
    nowDate.getMilliseconds() / 60000
  const headerOffset = activeView.value === "week" ? allDayRowHeight.value : SLOT_HEIGHT
  const m = Math.max(GRID_START_MINUTES, Math.min(GRID_END_MINUTES, minutes))
  return headerOffset + (m - GRID_START_MINUTES) * PX_PER_MINUTE + CURRENT_TIME_LINE_OFFSET_PX
})

const currentTimeLabel = computed(() => {
  return CalendarMath.formattedTime(nowTick.value, undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
})

const currentTimeSlotIndex = computed(() => {
  const minutes = nowTick.value.getHours() * 60 + nowTick.value.getMinutes()
  if (minutes < GRID_START_MINUTES || minutes >= GRID_END_MINUTES) return -1
  return Math.floor((minutes - GRID_START_MINUTES) / SLOT_MINUTES)
})

const showModal = ref(false)
const selectedEvent = ref(null)
const modalPosition = ref({ top: 0, left: 0 })
const saveError = ref("")

function validateEventForSave(ev) {
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

function openEvent(date, item, e) {
  saveError.value = ""
  const raw = item?.originalItem ? { ...item.originalItem } : { ...item }
  selectedEvent.value = raw
  if (!selectedEvent.value.startDate)
    selectedEvent.value.startDate = date instanceof Date ? date : new Date(date)
  if (!selectedEvent.value.endDate) selectedEvent.value.endDate = selectedEvent.value.startDate
  if (!selectedEvent.value.color) selectedEvent.value.color = DEFAULT_EVENT_COLOR

  if (e.currentTarget) {
    const rect = e.currentTarget.getBoundingClientRect()
    const modalWidth = 300
    const viewportWidth = window.innerWidth
    const top = rect.bottom + 10 + window.scrollY

    let left = rect.left + window.scrollX + 10

    if (left + modalWidth > viewportWidth) {
      left = rect.right - modalWidth - window.scrollX - 10
    }

    if (left < 0) {
      left = 0
    }

    modalPosition.value = {
      top: top,
      left: left,
    }
  }

  showModal.value = true
}

function openWeekSlot(day, slotIndex, e) {
  const slotStartMinutes = GRID_START_MINUTES + slotIndex * SLOT_MINUTES
  const start = new Date(day)
  start.setHours(Math.floor(slotStartMinutes / 60), slotStartMinutes % 60, 0, 0)
  const end = new Date(start.getTime() + SLOT_MINUTES * 60000)
  selectedEvent.value = {
    id: `new-${Date.now()}`,
    title: "Event name",
    startDate: start,
    endDate: end,
    description: "",
    color: DEFAULT_EVENT_COLOR,
  }
  openEvent(start, selectedEvent.value, e)
}

function openDaySlot(slotIndex, e) {
  openWeekSlot(showDate.value, slotIndex, e)
}

function openMonthNewEvent(day, e) {
  if (e?.target?.closest?.(".month-event, .cv-item")) return
  const start = new Date(day)
  start.setHours(9, 0, 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const draft = {
    id: `new-${Date.now()}`,
    title: "Event name",
    startDate: start,
    endDate: end,
    description: "",
    color: DEFAULT_EVENT_COLOR,
  }
  openEvent(start, draft, e)
}

function onCalendarViewClickDate(date, _items, e) {
  openMonthNewEvent(date, e)
}

function closeModal() {
  saveError.value = ""
  showModal.value = false
  selectedEvent.value = null
}

function saveEvent() {
  const check = validateEventForSave(selectedEvent.value)
  if (!check.ok) {
    saveError.value = check.message
    return
  }
  saveError.value = ""

  const idx = calendarItems.value.findIndex((e) => e.id === selectedEvent.value.id)

  const title = (selectedEvent.value.title ?? "").trim()

  if (idx !== -1) {
    calendarItems.value.splice(idx, 1, {
      id: selectedEvent.value.id,
      startDate: selectedEvent.value.startDate,
      endDate: selectedEvent.value.endDate,
      title,
      description: selectedEvent.value.description || selectedEvent.value.originalItem?.description,
      color: selectedEvent.value.color || DEFAULT_EVENT_COLOR,
    })
  } else {
    calendarItems.value.push({
      id: `e${calendarItems.value.length + 1}`,
      startDate: selectedEvent.value.startDate,
      endDate: selectedEvent.value.endDate,
      title,
      description: selectedEvent.value.description,
      color: selectedEvent.value.color || DEFAULT_EVENT_COLOR,
    })
  }
  closeModal()
}

function deleteEvent() {
  const idx = calendarItems.value.findIndex((e) => e.id === selectedEvent.value.id)

  if (idx !== -1) {
    calendarItems.value.splice(idx, 1)
  }
  closeModal()
}
</script>

<template>
  <Modal
    :showModal="showModal"
    :selectedEvent="selectedEvent || { title: '', startDate: '' }"
    :modalPosition="modalPosition"
    :save-error="saveError"
    @saveEvent="saveEvent"
    @closeModal="closeModal"
    @deleteEvent="deleteEvent"
  />
  <div class="calendar-shell mt-4">
    <div class="toolbar-top">
      <h2 class="title">Calendar View</h2>
      <div class="view-switch">
        <button
          class="calendar-btn"
          :class="{ 'is-active': activeView === 'month' }"
          @click="setView('month')"
        >
          Month
        </button>
        <button
          class="calendar-btn"
          :class="{ 'is-active': activeView === 'week' }"
          @click="setView('week')"
        >
          Week
        </button>
        <button
          class="calendar-btn"
          :class="{ 'is-active': activeView === 'day' }"
          @click="setView('day')"
        >
          Day
        </button>
        <button class="calendar-btn">Agenda</button>
      </div>
    </div>

    <div class="toolbar-nav">
      <div class="left-buttons">
        <button class="calendar-btn" @click="toCurrentPeriod(CalendarMath.today())">Today</button>
        <button class="calendar-btn" @click="movePeriod(-1)">Back</button>
        <button class="calendar-btn" @click="movePeriod(1)">Next</button>
      </div>
      <div class="period-title">{{ currentPeriodLabel }}</div>
      <div class="spacer"></div>
    </div>

    <div v-if="activeView === 'week'" class="week-board">
      <div class="week-grid-head">
        <div class="time-col-head"></div>
        <div
          v-for="column in weekColumns"
          :key="column.day.toISOString()"
          class="day-head"
          :class="{ 'today-column': isToday(column.day) }"
        >
          {{ column.day.toLocaleDateString(undefined, { weekday: "short" }) }}
          {{ String(column.day.getDate()).padStart(2, "0") }}/{{
            String(column.day.getMonth() + 1).padStart(2, "0")
          }}
        </div>
      </div>
      <div class="week-grid-body">
        <div class="time-col">
          <div class="time-cell all-day-label" :style="{ height: `${allDayRowHeight}px` }">
            all day
          </div>
          <div
            v-for="(label, idx) in timeLabels"
            :key="label"
            class="time-cell"
            :class="{ 'time-cell-current': idx === currentTimeSlotIndex }"
          >
            {{ label }}
          </div>
        </div>

        <div
          v-for="column in weekColumns"
          :key="`week-col-${column.day.toISOString()}`"
          class="day-column"
          :class="{ 'today-column': isToday(column.day) }"
          :data-day-ts="column.day.getTime()"
        >
          <div
            class="all-day-row"
            :style="{ height: `${allDayRowHeight}px` }"
            @dragover.prevent
            @drop="onAllDayRowDrop($event, column.day)"
          ></div>
          <div
            class="hour-grid"
            :style="{ height: `${dayGridHeight}px` }"
            @dragover.prevent
            @drop="onHourGridDrop($event, column.day)"
          >
            <div
              v-for="slotIndex in SLOT_COUNT"
              :key="`slot-${slotIndex}`"
              class="hour-slot"
              @click="openWeekSlot(column.day, slotIndex - 1, $event)"
              @dragover.prevent
              @drop="onHourGridDrop($event, column.day)"
            ></div>
            <div
              v-for="event in column.timedEvents"
              :key="`timed-${event.id}-${event._top}`"
              class="week-event week-event-timed"
              :class="{ 'week-event-short': event._isShort }"
              :style="weekTimedEventLayoutStyle(event)"
              draggable="true"
              @dragstart="onWeekDayDragStart($event, event)"
              @dragover.prevent
              @drop="onHourGridDrop($event, column.day)"
              @click.stop="openEvent(column.day, event, $event)"
            >
              {{ event.title }}
            </div>
          </div>
        </div>

        <div
          v-if="weekAllDaySpans.length"
          class="week-all-day-spans"
          :style="{ left: `${TIME_COL_WIDTH}px`, height: `${allDayRowHeight}px` }"
        >
          <div
            v-for="span in weekAllDaySpans"
            :key="`span-${span.id}-${span._startIndex}-${span._endIndex}`"
            class="week-event week-event-all-day"
            :style="weekSpanLayoutStyle(span)"
            draggable="true"
            @dragstart="onWeekDayDragStart($event, span)"
            @dragover.prevent
            @drop="onAllDayRowDrop($event, weekDays[span._startIndex])"
            @click.stop="openEvent(weekDays[span._startIndex], span, $event)"
          >
            {{ span.title }}
          </div>
        </div>

        <div
          v-if="showCurrentTimeLine"
          class="current-time-overlay"
          :style="{ top: `${currentTimeLineTop}px` }"
        >
          <span class="current-time-dot"></span>
          <span class="current-time-line"></span>
        </div>
      </div>
    </div>

    <div v-else-if="activeView === 'day'" class="week-board day-view-board">
      <div
        class="week-grid-head day-view-head"
        :class="{ 'day-view-head--today': isToday(dayColumn.day) }"
      >
        <div class="time-col-head day-view-time-gutter" aria-hidden="true"></div>
        <div class="day-head day-view-day-title">{{ dayViewHeaderLabel }}</div>
      </div>
      <div class="week-grid-body day-grid-body">
        <div class="time-col">
          <div class="time-cell all-day-label">all day</div>
          <div
            v-for="(label, idx) in timeLabels"
            :key="label"
            class="time-cell"
            :class="{ 'time-cell-current': idx === currentTimeSlotIndex }"
          >
            {{ label }}
          </div>
        </div>
        <div
          class="day-column"
          :class="{ 'today-column': isToday(dayColumn.day) }"
          :data-day-ts="dayColumn.day.getTime()"
        >
          <div class="all-day-row" @dragover.prevent @drop="onAllDayRowDrop($event, dayColumn.day)">
            <div
              v-for="event in dayColumn.allDayEvents"
              :key="`day-all-${event.id}`"
              class="week-event"
              :style="eventBlockStyle(event.color)"
              draggable="true"
              @dragstart="onWeekDayDragStart($event, event)"
              @dragover.prevent
              @drop="onAllDayRowDrop($event, dayColumn.day)"
              @click.stop="openEvent(dayColumn.day, event, $event)"
            >
              {{ event.title }}
            </div>
          </div>
          <div
            class="hour-grid"
            :style="{ height: `${dayGridHeight}px` }"
            @dragover.prevent
            @drop="onHourGridDrop($event, dayColumn.day)"
          >
            <div
              v-for="slotIndex in SLOT_COUNT"
              :key="`day-slot-${slotIndex}`"
              class="hour-slot"
              @click="openDaySlot(slotIndex - 1, $event)"
              @dragover.prevent
              @drop="onHourGridDrop($event, dayColumn.day)"
            ></div>
            <div
              v-for="event in dayColumn.timedEvents"
              :key="`day-timed-${event.id}-${event._top}`"
              class="week-event week-event-timed"
              :class="{ 'week-event-short': event._isShort }"
              :style="weekTimedEventLayoutStyle(event)"
              draggable="true"
              @dragstart="onWeekDayDragStart($event, event)"
              @dragover.prevent
              @drop="onHourGridDrop($event, dayColumn.day)"
              @click.stop="openEvent(dayColumn.day, event, $event)"
            >
              {{ event.title }}
            </div>
          </div>
        </div>

        <div
          v-if="showCurrentTimeLine"
          class="current-time-overlay"
          :style="{ top: `${currentTimeLineTop}px` }"
        >
          <span class="current-time-dot"></span>
          <span class="current-time-line"></span>
        </div>
      </div>
    </div>

    <CalendarView
      v-else
      :show-date="showDate"
      :items="itemsForCalendarView"
      :display-period-uom="activeView"
      :display-period-count="1"
      :enable-drag-drop="true"
      @drop-on-date="handleItemDrop"
      @click-item="(item, e) => openEvent(showDate, item, e)"
      @click-date="onCalendarViewClickDate"
      class="theme-default"
    />
    <div class="spacer"></div>
  </div>
</template>
