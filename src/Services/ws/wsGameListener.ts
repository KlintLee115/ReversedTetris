import { Game } from "../../core/GamePlayConfig";
import { socket } from "./websocket";


export function setupWebSocketGameListeners(game: Game) {
  socket.addEventListener('message', event => {

    const message = JSON.parse(event.data)

    const command = message.type;

    switch (command) {
      case "LeaveGame": {
        game.handleGameOver(false, undefined);
        game.textStatus.style.display = "none";

        break
      }

      case "ClearRows": {
        game.ClearRows(game.sideArea as HTMLElement);
        break
      }

      case "You Won": {
        game.handleGameOver(false, false);
        game.pauseScreen.style.display = "none";
        game.mainArea.style.display = "flex";
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
          PrevCoor:[ number, number][],
          NewCoor: [ number, number][],
          Color: string
        };

        game.moveFriend(payload.PrevCoor, payload.NewCoor, payload.Color);
        break;
    }
  })
}