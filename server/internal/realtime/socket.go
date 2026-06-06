// Package realtime exposes Socket.IO rooms, WebRTC signaling, and
// notification fan-out as a single HTTP-mountable engine.
//
// Rooms:
//   dm:{conversationId}    direct messages
//   clan:{clanId}          clan chat (text/audio/video)
//   stream:{streamId}      live stream chat + gifts
//   war:{warId}            clan-war live scoreboard
//   notif:{userId}         per-user notification push
package realtime

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	socketio "github.com/googollee/go-socket.io"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"

	"github.com/sigma/server/internal/auth"
	"github.com/sigma/server/internal/db"
)

type Engine struct {
	io       *socketio.Server
	pg       *db.PG
	mongo    *mongo.Client
	verifier *auth.Verifier
	log      *zap.Logger
}

func New(pg *db.PG, m *mongo.Client, v *auth.Verifier, log *zap.Logger) *Engine {
	srv := socketio.NewServer(nil)
	e := &Engine{io: srv, pg: pg, mongo: m, verifier: v, log: log}
	e.register()
	return e
}

func (e *Engine) Handler() http.Handler { return e.io }

func (e *Engine) Run(ctx context.Context) {
	go func() {
		if err := e.io.Serve(); err != nil {
			e.log.Error("socketio serve", zap.Error(err))
		}
	}()
	<-ctx.Done()
	_ = e.io.Close()
}

// Broadcast pushes a notification to a single user across all their sockets.
func (e *Engine) BroadcastNotification(userID string, payload any) {
	e.io.BroadcastToRoom("/", "notif:"+userID, "notification", payload)
}

// BroadcastWarScore updates everyone watching a clan war.
func (e *Engine) BroadcastWarScore(warID string, payload any) {
	e.io.BroadcastToRoom("/", "war:"+warID, "war:score", payload)
}

func (e *Engine) register() {
	// Auth handshake: client must send { token } in auth payload.
	e.io.OnConnect("/", func(s socketio.Conn) error {
		// In go-socket.io v1, query token via URL param ?token=
		token := s.URL().Query().Get("token")
		if token == "" {
			return errUnauthorized
		}
		claims, err := e.verifier.Verify(token)
		if err != nil {
			return errUnauthorized
		}
		s.SetContext(claims.UserID)
		// Auto-join personal notification room.
		s.Join("notif:" + claims.UserID)
		e.log.Info("socket connect", zap.String("user", claims.UserID))
		return nil
	})

	e.io.OnEvent("/", "join", func(s socketio.Conn, room string) {
		if !roomPermitted(room) {
			return
		}
		s.Join(room)
	})

	e.io.OnEvent("/", "leave", func(s socketio.Conn, room string) {
		s.Leave(room)
	})

	e.io.OnEvent("/", "message", func(s socketio.Conn, raw string) {
		uid, _ := s.Context().(string)
		var m struct {
			RoomID  string `json:"roomId"`
			Content string `json:"content"`
		}
		if err := json.Unmarshal([]byte(raw), &m); err != nil || m.Content == "" {
			return
		}
		doc := bson.M{
			"roomId":    m.RoomID,
			"senderId":  uid,
			"content":   m.Content,
			"createdAt": time.Now().UTC(),
		}
		if _, err := e.mongo.Database("sigma").Collection(db.CollChatMessages).InsertOne(context.Background(), doc); err != nil {
			e.log.Warn("mongo insert chat", zap.Error(err))
		}
		e.io.BroadcastToRoom("/", m.RoomID, "message", doc)
	})

	// WebRTC signaling — opaque relay between peers in the same room.
	e.io.OnEvent("/", "webrtc:signal", func(s socketio.Conn, raw string) {
		var sig struct {
			Room string          `json:"room"`
			To   string          `json:"to"`
			Data json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal([]byte(raw), &sig); err != nil {
			return
		}
		e.io.BroadcastToRoom("/", sig.Room, "webrtc:signal", map[string]any{
			"from": s.Context(),
			"to":   sig.To,
			"data": sig.Data,
		})
	})

	e.io.OnError("/", func(s socketio.Conn, err error) {
		e.log.Warn("socket error", zap.Error(err))
	})

	e.io.OnDisconnect("/", func(s socketio.Conn, reason string) {
		e.log.Info("socket disconnect", zap.String("reason", reason))
	})
}

func roomPermitted(room string) bool {
	for _, p := range []string{"dm:", "clan:", "stream:", "war:"} {
		if len(room) > len(p) && room[:len(p)] == p {
			return true
		}
	}
	return false
}

var errUnauthorized = &authError{"unauthorized"}

type authError struct{ msg string }

func (e *authError) Error() string { return e.msg }
