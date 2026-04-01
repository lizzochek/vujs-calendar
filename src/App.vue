<script setup>
import { computed, ref } from "vue"
import { CalendarMath } from "vue-simple-calendar"
import Modal from "./components/Modal.vue"
import CalendarWeekView from "./components/CalendarWeekView.vue"
import CalendarDayView from "./components/CalendarDayView.vue"
import CalendarMonthView from "./components/CalendarMonthView.vue"
import { useCalendarGridState } from "./composables/useCalendarGridState"
import { DEFAULT_EVENT_COLOR, GRID_START_MINUTES, PX_PER_MINUTE, SLOT_MINUTES } from "./constants/calendarGrid"
import "vue-simple-calendar/dist/vue-simple-calendar.css"
import "vue-simple-calendar/dist/css/default.css"
import "./assets/tailwind.css"
import { createEventDate, isAllDayEvent } from "./utils/calendarHelpers"
import { dayFromWeekOrDayGridPoint, roundToStepMinutes } from "./utils/dragDropHelpers"
import { calendarItemStyleString } from "./utils/eventStyles"
import { validateEventForSave } from "./utils/eventValidation"

const showDate = ref(new Date())
const activeView = ref("month")

const seedDate = new Date()
const seedYear = seedDate.getFullYear()
const seedMonth = seedDate.getMonth()

const calendarItems = ref([
  {
    id: "e1",
    startDate: createEventDate(seedYear, seedMonth, 4, 14, 0),
    endDate: createEventDate(seedYear, seedMonth, 4, 15, 30),
    title: "Morning Meeting",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#2f80ed",
  },
  {
    id: "e2",
    startDate: createEventDate(seedYear, seedMonth, 4, 14, 0),
    endDate: createEventDate(seedYear, seedMonth, 4, 15, 0),
    title: "Project Discussion",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#9b59b6",
  },
  {
    id: "e3",
    startDate: createEventDate(seedYear, seedMonth, 5, 8, 30),
    endDate: createEventDate(seedYear, seedMonth, 5, 9, 30),
    title: "Coffee with Client",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#27ae60",
  },
  {
    id: "e4",
    startDate: createEventDate(seedYear, seedMonth, 14, 12, 15),
    endDate: createEventDate(seedYear, seedMonth, 14, 13, 0),
    title: "Lunch Break",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#f39c12",
  },
  {
    id: "e5",
    startDate: createEventDate(seedYear, seedMonth, 20, 16, 0),
    endDate: createEventDate(seedYear, seedMonth, 20, 17, 30),
    title: "Afternoon Review",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#1abc9c",
  },
  {
    id: "e6",
    startDate: createEventDate(seedYear, seedMonth, 28, 10, 0),
    endDate: createEventDate(seedYear, seedMonth, 28, 10, 45),
    title: "Stand-up",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#e74c3c",
  },
  {
    id: "e7",
    startDate: createEventDate(seedYear, seedMonth, 29, 18, 0),
    endDate: createEventDate(seedYear, seedMonth, 29, 20, 0),
    title: "Team Dinner",
    description: "We will discuss the project progress and the upcoming tasks.",
    color: "#e91e8c",
  },
  {
    id: "e8",
    startDate: createEventDate(seedYear, seedMonth, 1, 0, 0),
    endDate: createEventDate(seedYear, seedMonth, 2, 0, 0),
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

const nowTick = ref(new Date())

const {
  timeLabels,
  weekDays,
  weekPeriodLabel,
  weekAllDaySpans,
  allDayRowHeight,
  weekColumns,
  dayColumn,
  dayViewHeaderLabel,
  showCurrentTimeLine,
  currentTimeLineTop,
  currentTimeSlotIndex,
  isToday,
} = useCalendarGridState({
  showDate,
  activeView,
  sortedCalendarItems,
  nowTick,
})

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

const showModal = ref(false)
const selectedEvent = ref(null)
const modalPosition = ref({ top: 0, left: 0 })
const saveError = ref("")

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

    <CalendarWeekView
      v-if="activeView === 'week'"
      :week-columns="weekColumns"
      :week-days="weekDays"
      :week-all-day-spans="weekAllDaySpans"
      :all-day-row-height="allDayRowHeight"
      :time-labels="timeLabels"
      :current-time-slot-index="currentTimeSlotIndex"
      :show-current-time-line="showCurrentTimeLine"
      :current-time-line-top="currentTimeLineTop"
      :is-today="isToday"
      @open-week-slot="openWeekSlot"
      @open-event="openEvent"
      @week-drag-start="onWeekDayDragStart"
      @hour-grid-drop="onHourGridDrop"
      @all-day-row-drop="onAllDayRowDrop"
    />

    <CalendarDayView
      v-else-if="activeView === 'day'"
      :day-column="dayColumn"
      :day-view-header-label="dayViewHeaderLabel"
      :time-labels="timeLabels"
      :current-time-slot-index="currentTimeSlotIndex"
      :show-current-time-line="showCurrentTimeLine"
      :current-time-line-top="currentTimeLineTop"
      :is-today="isToday"
      @open-day-slot="openDaySlot"
      @open-event="openEvent"
      @week-drag-start="onWeekDayDragStart"
      @hour-grid-drop="onHourGridDrop"
      @all-day-row-drop="onAllDayRowDrop"
    />

    <CalendarMonthView
      v-else
      :show-date="showDate"
      :items="itemsForCalendarView"
      :display-period-uom="activeView"
      @drop-on-date="handleItemDrop"
      @click-item="(item, e) => openEvent(showDate, item, e)"
      @click-date="onCalendarViewClickDate"
    />
    <div class="spacer"></div>
  </div>
</template>
