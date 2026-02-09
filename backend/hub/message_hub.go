package hub

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"golang.org/x/net/websocket"
)

// PlayerStatus represents the current state of a player
type PlayerStatus int

const (
	InGame PlayerStatus = iota
	Paused
	ReadyToBegin
)

// MovementData contains information about a piece movement
type MovementData struct {
	PrevCoor [][]int `json:"prevCoor"`
	NewCoor  [][]int `json:"newCoor"`
	Color    string  `json:"color"`
}

type MessageHub struct {
	connections     map[string]*websocket.Conn // connectionID -> connection
	rooms           map[string][]string        // roomID -> connectionIDs
	playerStatuses  map[string]PlayerStatus    // connectionID -> status
	connectionRooms map[string]string          // connectionID -> roomID
	mutex           sync.RWMutex
}

type WebSocketMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func NewMessageHub() *MessageHub {
	return &MessageHub{
		connections:     make(map[string]*websocket.Conn),
		rooms:           make(map[string][]string),
		playerStatuses:  make(map[string]PlayerStatus),
		connectionRooms: make(map[string]string),
	}
}

func (hub *MessageHub) validateMessage(wsMsg WebSocketMessage) bool {
	switch wsMsg.Type {
	case "JoinRoom", "SendMovement", "ClearRows", "RequestContinue", "GameOver", "NotifyPause":
		return true
	default:
		return false
	}
}

func (hub *MessageHub) HandleWebSocket(ws *websocket.Conn) {
	connID := generateConnectionID()
	if connID == "" {
		ws.Close()
		return
	}

	// Register connection
	hub.mutex.Lock()
	hub.connections[connID] = ws
	hub.playerStatuses[connID] = ReadyToBegin
	hub.mutex.Unlock()

	defer func() {
		hub.UnregisterConnection(connID)
		ws.Close()
	}()

	for {
		var wsMsg WebSocketMessage
		if err := websocket.JSON.Receive(ws, &wsMsg); err != nil {
			break
		}

		if !hub.validateMessage(wsMsg) {
			log.Printf("Invalid message type: %s", wsMsg.Type)
			continue
		}

		switch wsMsg.Type {
		case "JoinRoom":
			var roomID string
			if err := json.Unmarshal(wsMsg.Payload, &roomID); err == nil {
				hub.JoinRoom(connID, roomID)
			} else {
				log.Printf("Error unmarshaling room ID: %v", err)
			}
		case "SendMovement":
			hub.SendMovement(connID, wsMsg.Payload)
		case "ClearRows":
			var rows []int
			if err := json.Unmarshal(wsMsg.Payload, &rows); err == nil {
				hub.ClearRows(connID, rows)
			}
		case "RequestContinue":
			hub.RequestContinue(connID)
		case "GameOver":
			hub.GameOver(connID)
		case "NotifyPause":
			log.Print("Pause")
			hub.NotifyPause(connID)
		}
	}
}

// UnregisterConnection removes a connection from the hub
func (hub *MessageHub) UnregisterConnection(connID string) {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()

	// Remove from connections map
	delete(hub.connections, connID)
	delete(hub.playerStatuses, connID)

	// Check if connection is in a room
	if roomID, exists := hub.connectionRooms[connID]; exists {
		hub.removeConnectionFromRoomLocked(connID, roomID)
		hub.sendToGroup(roomID, WebSocketMessage{
			Type: "LeaveGame",
		})
	}
}

func (hub *MessageHub) SendMovement(connID string, data []byte) {
	hub.mutex.RLock()
	roomID, exists := hub.connectionRooms[connID]
	hub.mutex.RUnlock()

	if !exists {
		return
	}

	msg := WebSocketMessage{
		Type:    "Movement",
		Payload: data,
	}
	hub.sendToOthersInGroup(roomID, connID, msg)
}

// ClearRows notifies other players to clear rows
func (hub *MessageHub) ClearRows(connID string, rows []int) {
	hub.mutex.RLock()
	roomID, exists := hub.connectionRooms[connID]
	hub.mutex.RUnlock()

	if !exists {
		return
	}

	rowsData, _ := json.Marshal(rows)
	message := WebSocketMessage{
		Type:    "ClearRows",
		Payload: rowsData,
	}

	hub.sendToOthersInGroup(roomID, connID, message)
}

func (hub *MessageHub) JoinRoom(connID, roomID string) {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()

	if connections, ok := hub.rooms[roomID]; ok {
		for _, id := range connections {
			if status, exists := hub.playerStatuses[id]; exists {
				if status == InGame || status == Paused {
					hub.sendToConnection(connID, WebSocketMessage{
						Type: "RoomBusy",
					})
					return
				}
			}
		}

		if len(connections) >= 2 {
			hub.sendToConnection(connID, WebSocketMessage{
				Type: "RoomBusy",
			})
			return
		}
	}

	// Leave any existing room
	if currentRoom, exists := hub.connectionRooms[connID]; exists {
		hub.removeConnectionFromRoomLocked(connID, currentRoom)
	}

	// Join new room
	hub.connectionRooms[connID] = roomID
	hub.rooms[roomID] = append(hub.rooms[roomID], connID)
	hub.playerStatuses[connID] = ReadyToBegin

	// Check if we can start game
	connections := hub.rooms[roomID]

	if len(connections) == 2 {
		for _, id := range connections {
			hub.playerStatuses[id] = InGame
		}

		hub.sendToGroup(roomID, WebSocketMessage{
			Type: "StartGame",
		})
	}
}

// RequestContinue handles player requests to continue after pause
func (hub *MessageHub) RequestContinue(connID string) {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()

	roomID, exists := hub.connectionRooms[connID]
	if !exists {
		return
	}

	// Set requesting player to ready
	hub.playerStatuses[connID] = ReadyToBegin

	// Check if all players are ready
	allReady := true
	for _, id := range hub.rooms[roomID] {
		if hub.playerStatuses[id] != ReadyToBegin {
			allReady = false
			break
		}
	}

	if allReady {
		// Set all to in-game
		for _, id := range hub.rooms[roomID] {
			hub.playerStatuses[id] = InGame
		}

		// Notify to continue
		hub.sendToGroup(roomID, WebSocketMessage{
			Type: "Continue",
		})
	}
}

// GameOver notifies the other player that they won
func (hub *MessageHub) GameOver(connID string) {
	hub.mutex.RLock()
	roomID, exists := hub.connectionRooms[connID]
	hub.mutex.RUnlock()

	if !exists {
		return
	}

	hub.sendToOthersInGroup(roomID, connID, WebSocketMessage{
		Type: "You Won",
	})
}

// NotifyPause pauses the game for all players in a room
func (hub *MessageHub) NotifyPause(connID string) {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()

	roomID, exists := hub.connectionRooms[connID]
	if !exists {
		return
	}

	// Set all players to paused
	for _, id := range hub.rooms[roomID] {
		hub.playerStatuses[id] = Paused
	}

	// Notify others
	hub.sendToGroup(roomID, WebSocketMessage{
		Type: "Pause",
	})
}

func (hub *MessageHub) sendToGroup(roomID string, message WebSocketMessage) {
	if connections, ok := hub.rooms[roomID]; ok {
		msg, err := json.Marshal(message)
		if err != nil {
			log.Printf("Error marshaling message: %v", err)
			return
		}

		for _, connID := range connections {
			if ws, ok := hub.connections[connID]; ok {
				if err := websocket.Message.Send(ws, string(msg)); err != nil {
					log.Printf("Error sending message: %v", err)
				}
			}
		}
	}
}

func (hub *MessageHub) sendToOthersInGroup(roomID, senderID string, message WebSocketMessage) {
	if connections, ok := hub.rooms[roomID]; ok {
		msg, err := json.Marshal(message)
		if err != nil {
			log.Printf("Error marshaling message: %v", err)
			return
		}

		for _, connID := range connections {
			if connID != senderID {
				if ws, ok := hub.connections[connID]; ok {
					if err := websocket.Message.Send(ws, string(msg)); err != nil {
						log.Printf("Error sending message: %v", err)
					}
				}
			}
		}
	}
}

func (hub *MessageHub) sendToConnection(connID string, message WebSocketMessage) {
	msg, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	if ws, ok := hub.connections[connID]; ok {
		if err := websocket.Message.Send(ws, string(msg)); err != nil {
			log.Printf("Error sending message: %v", err)
		}
	}
}

func (hub *MessageHub) removeConnectionFromRoomLocked(connID, roomID string) {
	connections, ok := hub.rooms[roomID]
	if !ok {
		delete(hub.connectionRooms, connID)
		return
	}

	remaining := make([]string, 0, len(connections))
	for _, id := range connections {
		if id != connID {
			remaining = append(remaining, id)
		}
	}

	if len(remaining) == 0 {
		delete(hub.rooms, roomID)
	} else {
		hub.rooms[roomID] = remaining
	}

	delete(hub.connectionRooms, connID)
}

func generateConnectionID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return base64.URLEncoding.EncodeToString(b)
}
