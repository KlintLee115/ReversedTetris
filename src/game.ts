import { I, J, L, O, S, T, TetrisPiece, Z } from './TetrisPieces.js'
import { uncolorCoors, colorPlayingArea, makeLandingCoors } from './utility/colors.js';
import { BORDER_DEFAULT_COLOR, COLORS, COLUMNS, DEFAULT_COLOR, HIDDEN_ROWS, ROWS } from './utility/consts.js';

type GameModeType = "Friend" | "Solo"

export const TETRIS_PIECES = [I, O, J, T, L, S, Z]
export const HIGHEST_ALLOWED_DISPLAY_ROW = ROWS - HIDDEN_ROWS - 1
export let playingArea: HTMLElement

const mainArea = document.getElementsByTagName('main').item(0)!
const pauseScreen = document.getElementById('pauseScreen')!
const continueButton = document.getElementById('continueButton')!
const waitingForFriendStatus = document.getElementById('waiting-for-friend-status')!
const waitingForFriendCountdown = document.getElementById('waiting-for-friend-countdown')!

let friendArea: HTMLElement

// Game state
export let GameMode: GameModeType
export let currPiece: TetrisPiece
export let landingCoors: [number, number][] = []

let currPieceID: number
let currInterval: ReturnType<typeof setInterval>;
let isPaused = false;
let hasWon = false
let hasLost = false

export function setLandingCoors(_landingCoors: [number, number][]) {
    landingCoors = _landingCoors
}

// Utility Functions
const newPiece = (id: number) => new TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)](id)

function getCompletedRows() {

    const completeRows = []
    for (let row = 0; row < ROWS - HIDDEN_ROWS; row++) {
        if (Array.from(playingArea.children[row].children).every(box => (box as HTMLElement).style.backgroundColor !== DEFAULT_COLOR)) {
            completeRows.push(row);
        }
    }
    return completeRows
}

function togglePause(isThisInitiatizePause = false) {

    clearInterval(currInterval)

    if (hasWon || hasLost) return

    if (!isPaused) {
        pauseScreen.style.display = "none"
        waitingForFriendStatus.style.display = "block"
        mainArea.style.display = "none"
    }


    if (isThisInitiatizePause) {
        pauseScreen.style.display = "block"
        waitingForFriendStatus.style.display = "none"
        mainArea.style.filter = "blur(10px)";
    }

    isPaused = true

}

function toggleContinue() {

    isPaused = false;
    waitingForFriendStatus.style.display = "none"
    mainArea.style.filter = "none";
    mainArea.style.display = "flex";
    pauseScreen.style.display = "none"

    startInterval()

}

function inGameListener(listener: KeyboardEvent) {

    if (isPaused) return

    const oldCoors = currPiece.coor;

    const actions: { [key: string]: () => void } = {
        Space: () => currPiece.upAllTheWay(),
        ArrowLeft: () => currPiece.canMoveLeft() && currPiece.moveLeft(),
        ArrowRight: () => currPiece.canMoveRight() && currPiece.moveRight(),
        ArrowDown: () => currPiece.rotate(),
        ArrowUp: () => currPiece.canMoveUp() && currPiece.moveUp()
    };

    actions[listener.code]?.();

    uncolorCoors(oldCoors);

    colorPlayingArea(currPiece, currPiece.color);
}

export function getLandingCoors(pieceId: number, currPieceCoors: [number, number][]): [number, number][] {
    let updatedCoors = currPieceCoors;
    while (true) {
        if (updatedCoors.some(([row, col]) => row === 0 || (playingArea.children[row - 1].children[col] as HTMLElement).style.backgroundColor !== DEFAULT_COLOR && parseInt((playingArea.children[row - 1].children[col] as HTMLElement).id) !== pieceId)) {
            return updatedCoors;
        }
        updatedCoors = updatedCoors.map(([row, col]) => [row - 1, col]);
    }
}

function movePieceIntoPlayingArea() {
    while (currPiece.coor.every(coor => coor[0] > HIGHEST_ALLOWED_DISPLAY_ROW)) {
        currPiece.moveUp()
    }
    makeLandingCoors()
}

// check for completed rows, clear them and move up
/*
get completedRows list
loop through the list using variable x1, x2, say list= [0, 2, 4, 5]
 
let x1 = list[idx], x2 = list[idx+1], then idx++
1 is between 0 and 2, so row 1 move up 1 row cuz theres only 0 behind 1 in list
3 is between 2 and 4, so row 3 move up 2 rows cuz 0, 2 are behind 3 in list
... everything after 5 move up 4 rows cuz 0, 2, 4, 5 are behind 6 in list
 
therefore, 1->0, 3->1, 6->2, correct
*/

function clearRows(completedRows: number[], isFriendArea = false) {

    const areaToClear = isFriendArea ? friendArea : playingArea

    completedRows.forEach((upperBoundRow, idx) => {
        const lowerBoundRow = idx === completedRows.length - 1 ? ROWS - 1 : completedRows[idx + 1] - 1;
        for (let rowNum = upperBoundRow + 1; rowNum <= lowerBoundRow; rowNum++) {
            const currRow = areaToClear.children[rowNum] as HTMLElement;
            const targetRow = areaToClear.children[rowNum - (idx + 1)] as HTMLElement;
            for (let colNum = 0; colNum < COLUMNS; colNum++) {
                const currBox = currRow.children[colNum] as HTMLElement;
                const targetBox = targetRow.children[colNum] as HTMLElement;
                targetBox.style.borderColor = currBox.style.borderColor
                currBox.style.borderColor = BORDER_DEFAULT_COLOR
                targetBox.style.backgroundColor = currBox.style.backgroundColor;
                currBox.style.backgroundColor = DEFAULT_COLOR;
            }
        }
    });
}

function startNextRound() {

    currPieceID += 1
    currPiece = newPiece(currPieceID)

    movePieceIntoPlayingArea()

    startInterval()
}

function moveFriend(
    prevCoor: [number, number][],
    newCoor: [number, number][],
    color: typeof COLORS[number]) {


    prevCoor.forEach(coor => {
        (friendArea.children.item(coor[0])?.children.item(coor[1]) as HTMLElement).style.backgroundColor = DEFAULT_COLOR
    })
    newCoor.forEach(coor => {
        (friendArea.children.item(coor[0])?.children.item(coor[1]) as HTMLElement).style.backgroundColor = color
    })
}

function shouldMultiGameStart(): Promise<void> {
    return new Promise(async (resolve, _) => {
        const { connection } = await import("./utility/signalR.js")

        connection.on('UpdateGroupCount', (cnt: number) => cnt === 2 && resolve())
    })
}

// Game logic

function startInterval() {

    currInterval = setInterval(async () => {

        if (isPaused) return

        if (currPiece.hitTop()) {

            const completedRows = getCompletedRows()

            const { notifyClearRows } = await import("./utility/signalR.js")

            if (GameMode === "Friend") notifyClearRows(completedRows)

            clearRows(completedRows)

            clearInterval(currInterval)

            if (currPiece.coor.some(coor => coor[0] > HIGHEST_ALLOWED_DISPLAY_ROW) && currPiece.hitTop()) {

                hasLost = true

                const { notifyGameOver } = await import("./utility/signalR.js")

                if (GameMode === "Friend") await notifyGameOver()
                window.removeEventListener('keydown', inGameListener)
                alert("Game Over")
            }

            else startNextRound()
        }

        uncolorCoors(currPiece.coor)

        currPiece.moveUp()

        colorPlayingArea(currPiece, currPiece.color)

    }, 500 - (20 * (Math.floor(currPieceID / 5))))
}

window.onload = async () => {

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    GameMode = gameId === null ? "Solo" : "Friend"

    function setupPlayingArea() {

        for (let i = 0; i < (GameMode === "Friend" ? 2 : 1); i++) {

            const panel = document.createElement('div')
            panel.style.border = "3px solid white"
            panel.style.padding = "4px"

            if (i === 0) playingArea = panel
            else friendArea = panel

            for (let row = 0; row < 22; row++) {
                const rowOfBoxes = document.createElement('div');
                rowOfBoxes.style.display = "flex"
                rowOfBoxes.style.justifyContent = "center"
                if (row > HIGHEST_ALLOWED_DISPLAY_ROW) rowOfBoxes.style.display = "none"

                for (let col = 0; col < COLUMNS; col++) {
                    const newBox = document.createElement('div');
                    newBox.style.width = "2rem"
                    newBox.style.height = "2rem"
                    newBox.style.backgroundColor = DEFAULT_COLOR
                    newBox.style.border = "1px solid"
                    newBox.style.borderRadius = "1px"
                    newBox.style.margin = "1px"
                    newBox.style.borderColor = BORDER_DEFAULT_COLOR
                    rowOfBoxes.appendChild(newBox);
                }
                panel.appendChild(rowOfBoxes);
            }

            mainArea.appendChild(panel)
        }

        window.addEventListener('keydown', inGameListener)
        window.onblur = async () => {

            if (GameMode === "Solo") {
                togglePause(true)
                return
            }

            if (!(hasWon || hasLost)) {

                const { notifyPause } = await import("./utility/signalR.js")

                notifyPause()
                togglePause(true)
            }
        }

        continueButton.addEventListener('click', GameMode === "Solo" ? toggleContinue : async () => {
            waitingForFriendStatus.style.display = "block"
            pauseScreen.style.display = "none"
            mainArea.style.display = "none"

            const { requestContinue } = await import("./utility/signalR.js")

            requestContinue()
        })
    }

    currPieceID = 0

    if (GameMode === "Solo") {
        setupPlayingArea()

        playingArea.style.display = "block"
        startNextRound()
    }

    else {

        waitingForFriendStatus.style.display = "block"

        const { startSignalRConnection, joinRoom } = await import("./utility/signalR.js")

        await startSignalRConnection()
        joinRoom(gameId as string)

        shouldMultiGameStart().then(() => {
            setupSignalREventListeners()
            setupPlayingArea()

            waitingForFriendStatus.style.display = "none"
            playingArea.style.display = "block"

            startNextRound()
        })
    }
}

// SignalR

async function setupSignalREventListeners() {

    type MovementType = {
        prevCoor: [number, number][],
        newCoor: [number, number][],
        color: typeof COLORS[number],
    }

    const { connection } = await import("./utility/signalR.js")

    connection.on("ReceiveMovement", (data: MovementType) => {

        const { prevCoor, newCoor, color } = data

        moveFriend(prevCoor, newCoor, color)
    })

    connection.on("LeaveGame", () => {
        alert('Your friend has left the game. Continue to go to home screen')
        window.location.href = "/"
    })

    connection.on("ClearRows", (rows: number[]) => clearRows(rows, true))

    connection.on("You Won", () => {
        hasWon = true
        clearInterval(currInterval)
        alert("You Won!")
        pauseScreen.style.display = "none"
        mainArea.style.display = "flex"
    })
    connection.on("Pause", togglePause)
    connection.on("Continue", () => {

        waitingForFriendStatus.style.display = "none"
        waitingForFriendCountdown.style.display = "block"

        let remainingSeconds = 3

        let interval = setInterval(() => {

            if (remainingSeconds > 0) {
                waitingForFriendCountdown.innerHTML = remainingSeconds.toString()
                remainingSeconds--
            }
            else {
                waitingForFriendCountdown.innerHTML = ""
                waitingForFriendCountdown.style.display = "none"
                clearInterval(interval)
                toggleContinue()
            }
        }, 1000)
    })
}