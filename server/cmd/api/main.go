package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"github.com/sigma/server/internal/auth"
	"github.com/sigma/server/internal/config"
	"github.com/sigma/server/internal/db"
	"github.com/sigma/server/internal/graph"
	"github.com/sigma/server/internal/realtime"
)

func main() {
	_ = godotenv.Load()
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := config.Load()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pg, err := db.NewPostgres(ctx, cfg.PgDSN)
	if err != nil {
		logger.Fatal("postgres connect", zap.Error(err))
	}
	defer pg.Close()

	mongo, err := db.NewMongo(ctx, cfg.MongoURI)
	if err != nil {
		logger.Fatal("mongo connect", zap.Error(err))
	}
	defer mongo.Disconnect(ctx)

	jwtVerifier, err := auth.NewVerifier(ctx, cfg)
	if err != nil {
		logger.Fatal("jwt verifier", zap.Error(err))
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })

	// GraphQL
	gqlHandler := graph.NewHandler(pg, mongo, jwtVerifier)
	r.Any("/graphql", gin.WrapH(gqlHandler))
	r.GET("/playground", gin.WrapH(graph.NewPlayground("/graphql")))

	// Socket.IO + WebRTC signaling + notification fan-out
	rt := realtime.New(pg, mongo, jwtVerifier, logger)
	r.GET("/socket.io/*any", gin.WrapH(rt.Handler()))
	r.POST("/socket.io/*any", gin.WrapH(rt.Handler()))

	go rt.Run(ctx)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Info("sigma api listening", zap.String("port", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("listen", zap.Error(err))
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh
	logger.Info("shutting down")
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutCancel()
	_ = srv.Shutdown(shutCtx)
}
