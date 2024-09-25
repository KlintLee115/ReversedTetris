export const COLORS = ["purple", "green", "red", "rgb(31, 97, 204)", "rgb(209, 206, 42)"]

export const DEFAULT_COLOR = "rgb(15, 15, 15)"
export const BORDER_DEFAULT_COLOR = "rgb(0, 0, 0)"

export const ROWS = 22
export const COLUMNS = 8
export const HIDDEN_ROWS = 4

const cellSizeInRem = 2

const remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize); // Convert rem to pixels

const cellHeightInPx = cellSizeInRem * remToPx; // Cell height in pixels
const screenHeightInPx = window.innerHeight; // Total screen height in pixels

const cellWidthInPx = cellSizeInRem * remToPx; // Cell height in pixels
const screenWidthInPx = window.innerWidth; // Total screen height in pixels

export const BACKGROUND_ROWS_DISPLAYABLE = Math.round(screenHeightInPx / (cellHeightInPx+4)) // +4 to account for border and margin
export const BACKGROUND_PANELS = Math.round(screenWidthInPx / (cellWidthInPx+4)) // +4 to account for border and margin

export const BACKGROUND_COLUMNS = 8
export const BACKGROUND_HIDDEN_ROWS = 4

export const API_URL = "https://reversedtetrisapi.azurewebsites.net"