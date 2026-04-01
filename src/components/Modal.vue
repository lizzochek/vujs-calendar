<template>
  <div
    v-if="showModal"
    class="fixed z-50"
    :style="{
      top: modalPosition.top !== undefined ? Math.round(modalPosition.top) + 'px' : '50%',
      left: modalPosition.left !== undefined ? Math.round(modalPosition.left) + 'px' : '50%',
      transform:
        modalPosition.top !== undefined && modalPosition.left !== undefined
          ? 'none'
          : 'translate(-50%, -50%)',
    }"
  >
    <div class="bg-white w-[300px] rounded-lg border border-gray-200 shadow-lg p-6">
      <button
        @click="$emit('closeModal')"
        class="absolute top-3 right-3 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-white z-50"
        type="button"
      >
        ✕
      </button>

      <input
        v-model="selectedEvent.title"
        class="w-full border-b border-gray-300 pb-2 mb-6 outline-none text-gray-700 bg-transparent"
        placeholder="Work meeting"
        type="text"
      />
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex items-center justify-between border-b border-gray-300 pb-3">
          <input
            type="datetime-local"
            :value="selectedEvent.startDate ? getLocalDateTime(selectedEvent.startDate) : ''"
            @input="
              (e) => (e.target.value ? (selectedEvent.startDate = new Date(e.target.value)) : '')
            "
            class="outline-none w-full text-gray-600 bg-transparent"
          />
          <span class="ml-3 text-gray-400">🗓️</span>
        </div>
        <div class="flex items-center justify-between border-b border-gray-300 pb-3">
          <input
            type="datetime-local"
            :value="selectedEvent.endDate ? getLocalDateTime(selectedEvent.endDate) : ''"
            @input="
              (e) => (e.target.value ? (selectedEvent.endDate = new Date(e.target.value)) : '')
            "
            class="outline-none w-full text-gray-600 bg-transparent"
          />
          <span class="ml-3 text-gray-400">🗓️</span>
        </div>
      </div>

      <textarea
        :value="selectedEvent?.description ?? selectedEvent?.originalItem?.description ?? ''"
        @input="(e) => (selectedEvent.description = e.target.value)"
        placeholder="Take my PC"
        class="w-full border-b border-gray-300 mb-6 outline-none resize-none bg-transparent text-black h-10"
      />

      <div class="mb-8 flex items-center gap-3">
        <p class="text-xs text-gray-500 m-0">Color</p>
        <label class="relative inline-flex h-10 w-10 shrink-0 cursor-pointer rounded-full border-2 border-gray-200 shadow-sm overflow-hidden hover:ring-2 hover:ring-gray-300 hover:ring-offset-1">
          <input
            type="color"
            class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            :value="effectiveColor"
            aria-label="Event color"
            @input="setColor($event.target.value)"
          />
          <span
            class="pointer-events-none block h-full w-full rounded-full"
            :style="{ backgroundColor: effectiveColor }"
          />
        </label>
      </div>

      <p
        v-if="saveError"
        class="text-red-600 text-sm mb-4 leading-snug"
        role="alert"
      >
        {{ saveError }}
      </p>

      <div class="flex justify-between items-center">
        <button
          @click="$emit('deleteEvent')"
          class="text-red-500 text-sm tracking-wide uppercase"
          type="button"
        >
          Discard
        </button>
        <button
          @click="$emit('saveEvent')"
          class="text-indigo-500 text-sm tracking-wide uppercase"
          type="button"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"

const DEFAULT_EVENT_COLOR = "#2f80ed"

const props = defineProps({
  showModal: {
    type: Boolean,
    required: true,
  },
  selectedEvent: {
    type: Object,
    required: true,
  },
  modalPosition: {
    type: Object,
    required: true,
  },
  saveError: {
    type: String,
    default: "",
  },
})

defineEmits(["closeModal", "saveEvent"])

const effectiveColor = computed(() => {
  const c = props.selectedEvent?.color
  return typeof c === "string" && /^#/.test(c) ? c : DEFAULT_EVENT_COLOR
})

function setColor(hex) {
  if (props.selectedEvent) props.selectedEvent.color = hex
}

function getLocalDateTime(dateString) {
  const d = new Date(dateString)
  const pad = (n) => n.toString().padStart(2, "0")
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}
</script>
