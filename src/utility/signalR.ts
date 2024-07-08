import * as signalR from "@microsoft/signalr";
import { API_URL, COLORS } from "./consts";

export let connection: signalR.HubConnection;

export function startSignalRConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
        connection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_URL}/MessageHub`)
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                console.log("SignalR connection established.")
                resolve()
            })
            .catch(err => {
                console.error("SignalR connection error: ", err.toString())
                reject(err)
            })
    })
}

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

    connection.invoke("Pause")
        .catch(err => console.error("Error invoking SendMovement: ", err.toString()));
}

export function requestContinue() {

    connection.invoke("Continue")
        .catch(err => console.error("Error invoking SendMovement: ", err.toString()));
}