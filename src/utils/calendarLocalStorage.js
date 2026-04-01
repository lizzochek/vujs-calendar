const STORAGE_KEY = "state"

function encodeDate(value) {
  if (value == null) return undefined
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isNaN(ms) ? undefined : ms
}

function decodeDate(value) {
  if (value == null) return undefined
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function serializeItem(item) {
  const startMs = encodeDate(item.startDate)
  if (startMs === undefined) return null
  const row = { ...item, startDate: startMs }
  if (item.endDate != null) {
    const endMs = encodeDate(item.endDate)
    if (endMs !== undefined) row.endDate = endMs
  } else {
    delete row.endDate
  }
  return row
}

function deserializeItem(raw) {
  if (!raw?.id) return null
  const startDate = decodeDate(raw.startDate)
  if (!startDate) return null
  const item = { ...raw, startDate }
  if (raw.endDate != null) {
    const endDate = decodeDate(raw.endDate)
    if (endDate) item.endDate = endDate
  }
  return item
}

export function loadCalendarItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const list = data?.calendarItems
    if (!Array.isArray(list) || list.length === 0) return null

    const items = list.map(deserializeItem).filter(Boolean)
    return items.length > 0 ? items : null
  } catch {
    return null
  }
}

export function saveCalendarItems(items) {
  try {
    const calendarItems = items.map(serializeItem).filter(Boolean)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ calendarItems }))
  } catch {}
}

export function calendarPersistencePlugin() {
  return (store) => {
    store.subscribe((mutation, state) => {
      if (mutation.type === "initialiseStore") return
      setTimeout(() => saveCalendarItems(state.calendarItems), 100)
    })
  }
}
