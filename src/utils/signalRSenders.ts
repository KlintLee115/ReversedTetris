import signalR from "@microsoft/signalr";
import { COLORS } from "./consts";
import { connection } from "./signalR";

export function sendAMessage() {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("SendMessage", "LMAO")
            .catch(err => console.error("Error invoking SendMessage: ", err.toString()));
    } else {
        console.error("SignalR connection is not established.");
    }
}

export async function notifyGameOver() {
    try {
        await connection.invoke("GameOver");
    } catch (err) {
        console.error("Error invoking GameOver: ");
    }
}

export function joinRoom(roomId: string) {

    connection.invoke("JoinRoom", roomId)
        .catch(err => console.error("Error invoking JoinRoom: ", err.toString()));
}

export function notifyMovement(PrevCoor: [number, number][], NewCoor: [number, number][], Color: typeof COLORS[number]) {

    connection.invoke("SendMovement", JSON.stringify({
        PrevCoor, NewCoor, Color
    }))
        .catch(err => console.error("Error invoking SendMovement: ", err.toString()));
}

export function notifyClearRows(rows: number[]) {

    connection.invoke("ClearRows", rows)
        .catch(err => console.error("Error invoking SendMovement: ", err.toString()));
}

export function notifyPause() {

    connection.invoke("NotifyPause")
        .catch(err => console.error("Error invoking SendMovement: ", err.toString()));
}

export function requestContinue() {

    connection.invoke("Continue")
        .catch(err => console.error("Error invoking SendMovement: ", err.toString()));
}