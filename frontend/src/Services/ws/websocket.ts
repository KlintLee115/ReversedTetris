import { API_URL } from "../../consts";

export let socket: WebSocket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 5000;

export function startWebSocketConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
        const wsUrl = API_URL.replace(/^http/, 'ws') + '/MessageHub';
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket connection established');
            reconnectAttempts = 0;
            resolve();
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            reject(error);
        };

        socket.onclose = (event) => {
            console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
            if (reconnectAttempts < maxReconnectAttempts) {
                setTimeout(() => {
                    reconnectAttempts++;
                    console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})`);
                    startWebSocketConnection().catch(console.error);
                }, reconnectDelay);
            }
        }
    });
}

// Send message to server
export function sendMessage(type: string, data?: any) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ Type: type, Payload: data }));
    } else {
        console.error('WebSocket is not connected')
    }
}