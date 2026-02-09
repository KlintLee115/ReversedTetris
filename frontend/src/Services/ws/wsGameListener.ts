import { Game } from "../../core/GamePlayConfig";
import { socket } from "./websocket";

let countdownInterval: ReturnType<typeof setInterval>;

export function shouldGameStart(game: Game): Promise<void> {

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

export function setupWebSocketGameListeners(game: Game) {
  socket.addEventListener('message', event => {

    const message = JSON.parse(event.data)

    const command = message.type

    switch (command) {

      case "StartGame": {
        shouldGameStart(game).then(() => game.startFriendMode())
        break
      }

      case "LeaveGame": {
        game.handleFriendLeft();
        break
      }

      case "Pause": {
        game.togglePause();
        break;
      }

      case "ClearRows": {
        game.ClearRows(game.sideArea as HTMLElement);
        break
      }

      case "You Won": {
        game.handleGameOver(false);
        break
      }

      case "RoomBusy": {
        alert("The room is already full. Please try joining another room or create a new one.");
        window.location.href = "index.html";
        break
      }

      case "Continue": {

        game.textStatus.style.display = "block";

        let remainingSeconds = 3;
        const interval = setInterval(() => {
          if (remainingSeconds > 0) {
            game.textStatus.innerHTML = remainingSeconds.toString();
            remainingSeconds--;
          } else {
            game.textStatus.innerHTML = "";
            game.textStatus.style.display = "none";
            clearInterval(interval);
            game.toggleContinue();
          }
        }, 1000);
        break
      }

      case "Movement":
        const payload = message.payload as {
          PrevCoor: [number, number][],
          NewCoor: [number, number][],
          Color: string
        };

        game.moveFriend(payload.PrevCoor, payload.NewCoor, payload.Color);
        break;
    }
  })
}