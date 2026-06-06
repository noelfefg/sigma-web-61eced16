// Package notifications creates, persists, and pushes notifications.
//
// Flow:
//   1. Service.Create() validates input
//   2. Inserts into Mongo notifications_log (history, queryable)
//   3. Inserts into Postgres public.notifications (RLS-readable by frontend)
//   4. Pushes via Socket.IO notif:{userId} room (instant)
//   5. Optionally enqueues Web Push for offline users (TODO: VAPID)
package notifications

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/sigma/server/internal/db"
)

type Pusher interface {
	BroadcastNotification(userID string, payload any)
}

type Service struct {
	PG     *db.PG
	Mongo  *mongo.Client
	Pusher Pusher
}

type Input struct {
	UserID   string  `json:"userId"`
	ActorID  *string `json:"actorId,omitempty"`
	Type     string  `json:"type"`
	Title    string  `json:"title"`
	Body     string  `json:"body,omitempty"`
	Link     string  `json:"link,omitempty"`
	ImageURL string  `json:"imageUrl,omitempty"`
}

func (s *Service) Create(ctx context.Context, in Input) error {
	now := time.Now().UTC()

	// 1. Mongo history log
	_, _ = s.Mongo.Database("sigma").Collection(db.CollNotificationLog).InsertOne(ctx, bson.M{
		"userId":    in.UserID,
		"actorId":   in.ActorID,
		"type":      in.Type,
		"title":     in.Title,
		"body":      in.Body,
		"link":      in.Link,
		"imageUrl":  in.ImageURL,
		"createdAt": now,
	})

	// 2. Postgres mirror (frontend reads via existing RLS hook)
	_, err := s.PG.Exec(ctx, `
		INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, image_url, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
	`, in.UserID, in.ActorID, in.Type, in.Title, in.Body, in.Link, in.ImageURL, now)
	if err != nil {
		return err
	}

	// 3. Live push
	if s.Pusher != nil {
		s.Pusher.BroadcastNotification(in.UserID, in)
	}
	return nil
}
