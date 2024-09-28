import * as signalR from "@microsoft/signalr";
import { API_URL } from "./consts.ts";

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