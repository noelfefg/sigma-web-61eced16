// Package clans — clan + member operations against Postgres.
package clans

import (
	"context"

	"github.com/sigma/server/internal/db"
)

type Service struct{ PG *db.PG }

type CreateInput struct {
	OwnerID, Name, Slug, Tag, Description, Visibility string
}

func (s *Service) Create(ctx context.Context, in CreateInput) (string, error) {
	var id string
	err := s.PG.QueryRow(ctx, `
		INSERT INTO public.clans (owner_id, name, slug, tag, description, visibility, member_count, xp, level, treasury_coins)
		VALUES ($1, $2, $3, $4, $5, $6, 1, 0, 1, 0)
		RETURNING id
	`, in.OwnerID, in.Name, in.Slug, in.Tag, in.Description, in.Visibility).Scan(&id)
	if err != nil {
		return "", err
	}
	_, err = s.PG.Exec(ctx, `
		INSERT INTO public.clan_members (clan_id, user_id, role) VALUES ($1, $2, 'owner')
	`, id, in.OwnerID)
	return id, err
}

func (s *Service) Join(ctx context.Context, clanID, userID string) error {
	_, err := s.PG.Exec(ctx, `
		INSERT INTO public.clan_members (clan_id, user_id, role)
		VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING
	`, clanID, userID)
	if err == nil {
		_, _ = s.PG.Exec(ctx, `UPDATE public.clans SET member_count = member_count + 1 WHERE id = $1`, clanID)
	}
	return err
}

func (s *Service) Leave(ctx context.Context, clanID, userID string) error {
	ct, err := s.PG.Exec(ctx, `DELETE FROM public.clan_members WHERE clan_id = $1 AND user_id = $2`, clanID, userID)
	if err == nil && ct.RowsAffected() > 0 {
		_, _ = s.PG.Exec(ctx, `UPDATE public.clans SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1`, clanID)
	}
	return err
}
