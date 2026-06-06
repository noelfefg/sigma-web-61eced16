package config

import (
	"os"
	"strings"
)

type Config struct {
	Env             string
	Port            string
	PgDSN           string
	MongoURI        string
	SupabaseURL     string
	SupabaseJWKSURL string
	SupabaseJWTSec  string
	RedisURL        string
	VapidPublic     string
	VapidPrivate    string
	VapidSubject    string
	AllowedOrigins  []string
}

func get(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func Load() *Config {
	return &Config{
		Env:             get("ENV", "development"),
		Port:            get("PORT", "8080"),
		PgDSN:           os.Getenv("PG_DSN"),
		MongoURI:        os.Getenv("MONGO_URI"),
		SupabaseURL:     os.Getenv("SUPABASE_URL"),
		SupabaseJWKSURL: os.Getenv("SUPABASE_JWKS_URL"),
		SupabaseJWTSec:  os.Getenv("SUPABASE_JWT_SECRET"),
		RedisURL:        os.Getenv("REDIS_URL"),
		VapidPublic:     os.Getenv("VAPID_PUBLIC"),
		VapidPrivate:    os.Getenv("VAPID_PRIVATE"),
		VapidSubject:    get("VAPID_SUBJECT", "mailto:admin@sigma.app"),
		AllowedOrigins:  splitCSV(get("ALLOWED_ORIGINS", "*")),
	}
}

func splitCSV(s string) []string {
	out := []string{}
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
