<script setup>
import {
  DAY_GRID_HEIGHT,
  SLOT_COUNT,
  TIME_COL_WIDTH,
} from "../constants/calendarGrid"
import {
  weekSpanLayoutStyle,
  weekTimedEventLayoutStyle,
} from "../utils/eventStyles"

defineProps({
  weekColumns: { type: Array, required: true },
  weekDays: { type: Array, required: true },
  weekAllDaySpans: { type: Array, required: true },
  allDayRowHeight: { type: Number, required: true },
  timeLabels: { type: Array, required: true },
  currentTimeSlotIndex: { type: Number, required: true },
  showCurrentTimeLine: { type: Boolean, required: true },
  currentTimeLineTop: { type: Number, required: true },
  isToday: { type: Function, required: true },
})

const emit = defineEmits([
  "open-week-slot",
  "open-event",
  "week-drag-start",
  "hour-grid-drop",
  "all-day-row-drop",
])
</script>

<template>
  <div class="week-board">
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
          @drop="emit('all-day-row-drop', $event, column.day)"
        ></div>
        <div
          class="hour-grid"
          :style="{ height: `${DAY_GRID_HEIGHT}px` }"
          @dragover.prevent
          @drop="emit('hour-grid-drop', $event, column.day)"
        >
          <div
            v-for="slotIndex in SLOT_COUNT"
            :key="`slot-${slotIndex}`"
            class="hour-slot"
            @click="emit('open-week-slot', column.day, slotIndex - 1, $event)"
            @dragover.prevent
            @drop="emit('hour-grid-drop', $event, column.day)"
          ></div>
          <div
            v-for="event in column.timedEvents"
            :key="`timed-${event.id}-${event._top}`"
            class="week-event week-event-timed"
            :class="{ 'week-event-short': event._isShort }"
            :style="weekTimedEventLayoutStyle(event)"
            draggable="true"
            @dragstart="emit('week-drag-start', $event, event)"
            @dragover.prevent
            @drop="emit('hour-grid-drop', $event, column.day)"
            @click.stop="emit('open-event', column.day, event, $event)"
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
          @dragstart="emit('week-drag-start', $event, span)"
          @dragover.prevent
          @drop="emit('all-day-row-drop', $event, weekDays[span._startIndex])"
          @click.stop="emit('open-event', weekDays[span._startIndex], span, $event)"
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
</template>
