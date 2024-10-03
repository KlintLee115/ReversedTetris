import { Game } from "../core/GamePlayConfig"
import { COLORS } from "./consts"
import { connection } from "./signalR"

export async function setupSignalRGameListeners(game: Game) {

    connection.on("LeaveGame", () => {
        clearInterval(game.currInterval)
        game.textStatus.style.display = "none"
        window.removeEventListener('keydown', game.inGameListenerBound)
    })

    connection.on("ReceiveMovement", (data: {
        prevCoor: [number, number][],
        newCoor: [number, number][],
        color: typeof COLORS[number],
    }) => {

        const { prevCoor, newCoor, color } = data

        game.moveFriend(prevCoor, newCoor, color)
    })

    connection.on("ClearRows", () => {
        game.clearRows(game.sideArea as HTMLElement)
    })

    connection.on("You Won", () => {
        window.removeEventListener('keydown', game.inGameListenerBound)

        clearInterval(game.currInterval)
        alert("You Won!")
        game.pauseScreen.style.display = "none"
        game.mainArea.style.display = "flex"
    })

    connection.on("Continue", () => {

        game.textStatus.style.display = "none"
        game.textStatus.style.display = "block"

        let remainingSeconds = 3

        let interval = setInterval(() => {

            if (remainingSeconds > 0) {
                game.textStatus.innerHTML = remainingSeconds.toString()
                remainingSeconds--
            }
            else {
                game.textStatus.innerHTML = ""
                game.textStatus.style.display = "none"
                clearInterval(interval)
                game.toggleContinue()
            }
        }, 1000)
    })
}