import { Game } from "../../core/GamePlayConfig"
import { connection } from "./signalR"

let interval: ReturnType<typeof setInterval>

export async function setupSignalRSetupListeners(game: Game) {

    connection.on("LeaveGame", () => {
        clearInterval(interval)
        alert('Your friend has left the game.')
        game.textStatus.style.display = "block"
        game.textStatus.innerText = "Your friend has left the game."
    })

    connection.on("Pause", () => game.togglePause())
    connection.on("Continue", () => preGameCountDown(game))
    connection.on("GameStarted", (description: string) => {
        game.textStatus.style.display = "block"
        game.textStatus.innerText = description
    })
}

function preGameCountDown(game: Game): Promise<void> {
    return new Promise((resolve) => {
        game.textStatus.style.display = "block";
        let remainingSeconds = 3;

        interval = setInterval(() => {
            if (remainingSeconds > 0) {
                game.textStatus.innerText = remainingSeconds.toString();
                remainingSeconds--;
            } else {
                game.textStatus.innerHTML = "";
                game.textStatus.style.display = "none";
                clearInterval(interval);
                resolve()
            }
        }, 1000);
    });
}

export function shouldGameStart(game: Game): Promise<void> {
    return new Promise(async (resolve, _) => {
        connection.on('PreGameCountdownShouldStart', async () => {
            await preGameCountDown(game)
            connection.off('Continue')
            resolve()
        })
    })
}