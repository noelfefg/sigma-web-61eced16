// Package auth verifies Supabase-issued JWTs.
// Supports both legacy HS256 (project JWT secret) and modern RS256 via JWKS.
package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"

	"github.com/sigma/server/internal/config"
)

type Claims struct {
	UserID string `json:"sub"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type Verifier struct {
	jwks      keyfunc.Keyfunc
	hmacSecret []byte
}

func NewVerifier(ctx context.Context, cfg *config.Config) (*Verifier, error) {
	v := &Verifier{hmacSecret: []byte(cfg.SupabaseJWTSec)}
	if cfg.SupabaseJWKSURL != "" {
		k, err := keyfunc.NewDefaultCtx(ctx, []string{cfg.SupabaseJWKSURL})
		if err == nil {
			v.jwks = k
		}
	}
	if v.jwks == nil && len(v.hmacSecret) == 0 {
		return nil, errors.New("no JWT verification method configured")
	}
	return v, nil
}

func (v *Verifier) Verify(token string) (*Claims, error) {
	c := &Claims{}
	parser := jwt.NewParser(jwt.WithLeeway(30 * time.Second))
	_, err := parser.ParseWithClaims(token, c, func(t *jwt.Token) (interface{}, error) {
		switch t.Method.Alg() {
		case "RS256", "ES256":
			if v.jwks == nil {
				return nil, errors.New("no JWKS configured")
			}
			return v.jwks.Keyfunc(t)
		case "HS256":
			return v.hmacSecret, nil
		}
		return nil, errors.New("unsupported alg: " + t.Method.Alg())
	})
	return c, err
}

func (v *Verifier) FromRequest(r *http.Request) (*Claims, error) {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return nil, errors.New("missing bearer token")
	}
	return v.Verify(strings.TrimPrefix(h, "Bearer "))
}
