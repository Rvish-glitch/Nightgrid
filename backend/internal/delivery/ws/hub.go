package ws

import (
	"log"
	"sync"

	"geofencing-backend/internal/domain"
)

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan domain.WebSocketAlertMessage
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan domain.WebSocketAlertMessage, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("[WS Hub] Client connected. Total active clients: %d", len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("[WS Hub] Client disconnected. Total active clients: %d", len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Broadcast dispatches an alert message to all connected WebSocket clients asynchronously
func (h *Hub) Broadcast(alert domain.WebSocketAlertMessage) {
	select {
	case h.broadcast <- alert:
	default:
		log.Printf("[WS Hub] Warning: Broadcast channel full, dropping message %s", alert.EventID)
	}
}

