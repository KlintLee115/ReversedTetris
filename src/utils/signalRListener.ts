import { Game } from "../core/GamePlayConfig"
import { COLORS } from "./consts"
import { connection } from "./signalR"

export async function setupSignalREventListeners(game: Game) {

    connection.on("ReceiveMovement", (data: {
        prevCoor: [number, number][],
        newCoor: [number, number][],
        color: typeof COLORS[number],
    }) => {

        const { prevCoor, newCoor, color } = data

        game.moveFriend(prevCoor, newCoor, color)
    })

    connection.on("LeaveGame", () => {
        alert('Your friend has left the game. Continue to go to home screen')
        window.location.href = "/"
    })

    connection.on("ClearRows", () => {
        game.clearRows(game.sideArea as HTMLElement)
    })

    connection.on("You Won", () => {
        game.hasWon = true
        clearInterval(game.currInterval)
        alert("You Won!")
        game.pauseScreen.style.display = "none"
        game.mainArea.style.display = "flex"
    })
    connection.on("Pause", () => game.togglePause())
    connection.on("Continue", () => {

        game.waitingForFriendStatus.style.display = "none"
        game.waitingForFriendCountdown.style.display = "block"

        let remainingSeconds = 3

        let interval = setInterval(() => {

            if (remainingSeconds > 0) {
                game.waitingForFriendCountdown.innerHTML = remainingSeconds.toString()
                remainingSeconds--
            }
            else {
                game.waitingForFriendCountdown.innerHTML = ""
                game.waitingForFriendCountdown.style.display = "none"
                clearInterval(interval)
                game.toggleContinue()
            }
        }, 1000)
    })
}

export function shouldMultiGameStart(): Promise<void> {
    return new Promise(async (resolve, _) => {
        connection.on('GameShouldStart', () => resolve())
    })
}