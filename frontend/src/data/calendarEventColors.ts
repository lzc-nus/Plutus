export const calendarEventColors = [
  {
    value: "GOLD",
    label: "Gilded gold",
    swatch: "#d7b75b",
    background: "#f7ebc9",
    border: "#c19a3a",
    text: "#3f3116",
  },
  {
    value: "OLIVE",
    label: "Estate olive",
    swatch: "#87924a",
    background: "#e5ead2",
    border: "#7b8541",
    text: "#28301b",
  },
  {
    value: "SAGE",
    label: "Sage ledger",
    swatch: "#78937a",
    background: "#dfe9df",
    border: "#6f8a72",
    text: "#243126",
  },
  {
    value: "TERRACOTTA",
    label: "Terracotta seal",
    swatch: "#b86a48",
    background: "#f0d7c7",
    border: "#ad5f3d",
    text: "#482618",
  },
  {
    value: "WINE",
    label: "Sicilian wine",
    swatch: "#8f3f52",
    background: "#ead1d7",
    border: "#823648",
    text: "#3f1821",
  },
  {
    value: "INK",
    label: "Archive ink",
    swatch: "#1d211c",
    background: "#dfddd2",
    border: "#343b32",
    text: "#1d211c",
  },
] as const;

export type CalendarEventColor = (typeof calendarEventColors)[number]["value"];

export const defaultCalendarEventColor: CalendarEventColor = "GOLD";

export const calendarEventColorValues = calendarEventColors.map(color => color.value) as [
  CalendarEventColor,
  ...CalendarEventColor[],
];

export function getCalendarEventColor(color: string | null | undefined) {
  return calendarEventColors.find(option => option.value === color) ?? calendarEventColors[0];
}
