package db

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func NewMongo(ctx context.Context, uri string) (*mongo.Client, error) {
	return mongo.Connect(ctx, options.Client().ApplyURI(uri))
}

// Collection names — single source of truth.
const (
	CollChatMessages    = "chat_messages"
	CollNotificationLog = "notifications_log"
	CollAnalytics       = "analytics_events"
	CollWebRTCRooms     = "webrtc_rooms"
)
