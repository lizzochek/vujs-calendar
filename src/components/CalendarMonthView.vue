<script setup>
import { CalendarView } from "vue-simple-calendar"

defineProps({
  showDate: { type: [Date, Object], required: true },
  items: { type: Array, required: true },
  displayPeriodUom: { type: String, required: true },
  startingDayOfWeek: { type: Number, default: 0 },
})

const emit = defineEmits(["drop-on-date", "click-item", "click-date"])
</script>

<template>
  <CalendarView
    :show-date="showDate"
    :items="items"
    :display-period-uom="displayPeriodUom"
    :display-period-count="1"
    :starting-day-of-week="startingDayOfWeek"
    :enable-drag-drop="true"
    @drop-on-date="(item, date) => emit('drop-on-date', item, date)"
    @click-item="(item, e) => emit('click-item', item, e)"
    @click-date="(date, items, e) => emit('click-date', date, items, e)"
    class="theme-default"
  />
</template>
