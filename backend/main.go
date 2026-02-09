package main

import (
	"crypto/rand"
	"encoding/base64"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"reversed_tetris/hub"

	"golang.org/x/net/websocket"
)

// RoomManager handles room ID generation and tracking
type RoomManager struct {
	usedRoomIds map[string]bool
	mutex       sync.Mutex
}

var (
	roomManager = &RoomManager{usedRoomIds: make(map[string]bool)}
	messageHub  = hub.NewMessageHub()
)

func main() {
	log.Println("Starting Reversed Tetris server...")

	staticDir := filepath.FromSlash("../frontend/dist")

	mux := http.NewServeMux()
	mux.HandleFunc("/api/roomId", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)

		roomId := roomManager.GenerateUniqueRoomId()
		w.Write([]byte(roomId))
	})

	mux.Handle("/api/MessageHub", websocket.Handler(messageHub.HandleWebSocket))
	mux.Handle("/", staticHandler(staticDir))

	log.Fatal(http.ListenAndServe(":80", mux))
}

func staticHandler(staticDir string) http.Handler {
	fileServer := http.FileServer(http.Dir(staticDir))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/":
			http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
			return
		case "/game":
			http.ServeFile(w, r, filepath.Join(staticDir, "game.html"))
			return
		}

		cleanPath := filepath.Clean(r.URL.Path)
		if strings.Contains(cleanPath, "..") {
			http.NotFound(w, r)
			return
		}

		fullPath := filepath.Join(staticDir, cleanPath)
		if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
			fileServer.ServeHTTP(w, r)
			return
		}

		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
	})
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// GenerateUniqueRoomId creates a unique room ID
func (rm *RoomManager) GenerateUniqueRoomId() string {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	bytes := make([]byte, 6)
	if _, err := rand.Read(bytes); err != nil {
		log.Fatal(err)
	}

	roomId := base64.URLEncoding.EncodeToString(bytes)[:8]

	// Ensure uniqueness
	for rm.usedRoomIds[roomId] {
		if _, err := rand.Read(bytes); err != nil {
			log.Fatal(err)
		}
		roomId = base64.URLEncoding.EncodeToString(bytes)[:8]
	}

	rm.usedRoomIds[roomId] = true
	return roomId
}
