export const COLORS = ["purple", "green", "red", "rgb(31, 97, 204)", "rgb(209, 206, 42)"]

export const DEFAULT_COLOR = "rgb(15, 15, 15)"
export const BORDER_DEFAULT_COLOR = "rgb(0, 0, 0)"

export const COLUMNS = 8
export const HIDDEN_ROWS = 4

const cellSizeInRem = 2

const remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize); // Convert rem to pixels

const cellHeightInPx = cellSizeInRem * remToPx; // Cell height in pixels
const screenHeightInPx = window.innerHeight; // Total screen height in pixels

const cellWidthInPx = cellSizeInRem * remToPx; // Cell height in pixels
const screenWidthInPx = window.innerWidth; // Total screen height in pixels

export const ROWS_DISPLAYABLE = Math.round(screenHeightInPx / (cellHeightInPx+4)) // +4 to account for border and margin

export const BACKGROUND_PANELS = Math.round(screenWidthInPx / (cellWidthInPx+4)) // +4 to account for border and margin

export const API_URL = "https://reversedtetrisapi.azurewebsites.net"
// export const API_URL = "http://10.187.151.37:8080"
// export const API_URL = "http://localhost:8080"