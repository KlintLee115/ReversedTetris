import { Game } from "../../core/GamePlayConfig";
import { socket } from "./websocket";

let countdownInterval: ReturnType<typeof setInterval>;

export function setupWebSocketSetupListeners(game: Game) {
    socket.addEventListener("message", (event) => {
        const command = event.data

        switch (command) {
            case "LeaveGame": {
                game.handleGameOver(false, undefined);
                game.textStatus.style.display = "block";
                game.textStatus.innerText = "Your friend has left the game.";
                break
            }
            case "Pause": {
                game.togglePause();
                break;
            }
            case "Continue": {
                preGameCountDown(game)
                break
            }
            case "StartGame": {
                game.textStatus.style.display = "block";
                break
            }
        }
    });
}

function preGameCountDown(game: Game): Promise<void> {

    return new Promise((resolve) => {
        game.textStatus.style.display = "block";
        let remainingSeconds = 3;

        countdownInterval = setInterval(() => {
            if (remainingSeconds > 0) {
                game.textStatus.innerText = remainingSeconds.toString();
                remainingSeconds--;
            } else {
                game.textStatus.innerHTML = "";
                game.textStatus.style.display = "none";
                clearInterval(countdownInterval);
                resolve();
            }
        }, 1000);
    });
}

export function shouldGameStart(game: Game): Promise<void> {

    return new Promise((resolve) => {
        const handler = async () => {

            await preGameCountDown(game);
            resolve()

            socket.removeEventListener("message", handler);
        };

        socket.addEventListener("message", handler)
    });
}