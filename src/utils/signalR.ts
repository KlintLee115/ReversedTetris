import {HubConnectionBuilder} from "@microsoft/signalr";
import { API_URL } from "./consts.ts";

export let connection: signalR.HubConnection;

export function startSignalRConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
        connection = new HubConnectionBuilder()
            .withUrl(`${API_URL}/MessageHub`)
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                resolve()
            })
            .catch(err => {
                console.error("SignalR connection error: ", err.toString())
                reject(err)
            })
    })
}