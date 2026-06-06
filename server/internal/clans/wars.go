// Package clans — clan war state machine.
//
// States: idle → challenged → accepted → live → ended → settled
//
// Live scoreboard reads from `clan_war_gifts` (sum coin_value per clan).
// A goroutine per war calls finalize() at ends_at.
package clans

import (
	"context"
	"time"
)

type War struct {
	ID      string
	ClanA   string
	ClanB   string
	Status  string
	EndsAt  time.Time
}

type WarService struct{ PG interface{ /* *db.PG */ } }

// Challenge creates a pending war between two clans.
// (Implementation stub — to be wired with concrete PG type when generated.)
func ChallengeSQL() string {
	return `
INSERT INTO public.clan_wars (clan_a, clan_b, status, ends_at)
VALUES ($1, $2, 'challenged', now() + ($3 || ' seconds')::interval)
RETURNING id, status, ends_at
`
}

func ScoreSQL() string {
	return `
SELECT clan_id, COALESCE(SUM(coin_value), 0) AS score
FROM public.clan_war_gifts
WHERE war_id = $1
GROUP BY clan_id
`
}

func FinalizeSQL() string {
	return `
WITH totals AS (
  SELECT clan_id, SUM(coin_value) AS s
  FROM public.clan_war_gifts WHERE war_id = $1
  GROUP BY clan_id
), winner AS (
  SELECT clan_id FROM totals ORDER BY s DESC LIMIT 1
)
UPDATE public.clan_wars
SET status = 'settled',
    winner_clan_id = (SELECT clan_id FROM winner)
WHERE id = $1
`
}

// ScheduleFinalize starts a timer that closes a war at ends_at.
func ScheduleFinalize(ctx context.Context, w War, run func(context.Context, string) error) {
	d := time.Until(w.EndsAt)
	if d <= 0 {
		_ = run(ctx, w.ID)
		return
	}
	go func() {
		t := time.NewTimer(d)
		defer t.Stop()
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			_ = run(ctx, w.ID)
		}
	}()
}
