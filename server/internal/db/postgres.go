package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PG struct{ *pgxpool.Pool }

func NewPostgres(ctx context.Context, dsn string) (*PG, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}
	return &PG{pool}, nil
}
