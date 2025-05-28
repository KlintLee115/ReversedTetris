import { sendMessage } from "./websocket";
import { COLORS } from "../../consts";

// Helper function to check WebSocket connection state
function isConnected(): boolean {
    return sendMessage !== undefined; // Add more robust connection checking if needed
}

export function sendAMessage() {
    if (isConnected()) {
        sendMessage("SendMessage", "LMAO");
    } else {
        console.error("WebSocket connection is not established.");
    }
}

export function notifyGameOver() {
    sendMessage("GameOver");
}

export function joinRoom(roomId: string) {
    sendMessage("JoinRoom", roomId);
}

export function notifyMovement(PrevCoor: [number, number][], NewCoor: [number, number][], Color: typeof COLORS[number]) {
    sendMessage("SendMovement", {
        PrevCoor,
        NewCoor,
        Color
    });
}

export function notifyClearRows(rows: number[]) {
    sendMessage("ClearRows", rows);
}

export function notifyPause() {
    sendMessage("NotifyPause");
}

export function requestContinue() {
    sendMessage("RequestContinue");
}