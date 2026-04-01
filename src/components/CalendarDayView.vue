<script setup>
import { DAY_GRID_HEIGHT, SLOT_COUNT } from "../constants/calendarGrid"
import { eventBlockStyle, weekTimedEventLayoutStyle } from "../utils/eventStyles"

defineProps({
  dayColumn: { type: Object, required: true },
  dayViewHeaderLabel: { type: String, required: true },
  timeLabels: { type: Array, required: true },
  currentTimeSlotIndex: { type: Number, required: true },
  showCurrentTimeLine: { type: Boolean, required: true },
  currentTimeLineTop: { type: Number, required: true },
  isToday: { type: Function, required: true },
})

const emit = defineEmits([
  "open-day-slot",
  "open-event",
  "week-drag-start",
  "hour-grid-drop",
  "all-day-row-drop",
])
</script>

<template>
  <div class="week-board day-view-board">
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
        <div
          class="all-day-row"
          @dragover.prevent
          @drop="emit('all-day-row-drop', $event, dayColumn.day)"
        >
          <div
            v-for="event in dayColumn.allDayEvents"
            :key="`day-all-${event.id}`"
            class="week-event"
            :style="eventBlockStyle(event.color)"
            draggable="true"
            @dragstart="emit('week-drag-start', $event, event)"
            @dragover.prevent
            @drop="emit('all-day-row-drop', $event, dayColumn.day)"
            @click.stop="emit('open-event', dayColumn.day, event, $event)"
          >
            {{ event.title }}
          </div>
        </div>
        <div
          class="hour-grid"
          :style="{ height: `${DAY_GRID_HEIGHT}px` }"
          @dragover.prevent
          @drop="emit('hour-grid-drop', $event, dayColumn.day)"
        >
          <div
            v-for="slotIndex in SLOT_COUNT"
            :key="`day-slot-${slotIndex}`"
            class="hour-slot"
            @click="emit('open-day-slot', slotIndex - 1, $event)"
            @dragover.prevent
            @drop="emit('hour-grid-drop', $event, dayColumn.day)"
          ></div>
          <div
            v-for="event in dayColumn.timedEvents"
            :key="`day-timed-${event.id}-${event._top}`"
            class="week-event week-event-timed"
            :class="{ 'week-event-short': event._isShort }"
            :style="weekTimedEventLayoutStyle(event)"
            draggable="true"
            @dragstart="emit('week-drag-start', $event, event)"
            @dragover.prevent
            @drop="emit('hour-grid-drop', $event, dayColumn.day)"
            @click.stop="emit('open-event', dayColumn.day, event, $event)"
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
</template>
