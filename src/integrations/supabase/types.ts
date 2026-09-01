export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ranks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          is_live: boolean
          kind: string
          name: string
          owner_id: string
          parent_id: string | null
          stream_kind: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_live?: boolean
          kind: string
          name: string
          owner_id: string
          parent_id?: string | null
          stream_kind?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_live?: boolean
          kind?: string
          name?: string
          owner_id?: string
          parent_id?: string | null
          stream_kind?: string
        }
        Relationships: []
      }
      clan_announcements: {
        Row: {
          author_id: string
          body: string
          clan_id: string
          created_at: string
          id: string
          pinned: boolean
        }
        Insert: {
          author_id: string
          body: string
          clan_id: string
          created_at?: string
          id?: string
          pinned?: boolean
        }
        Update: {
          author_id?: string
          body?: string
          clan_id?: string
          created_at?: string
          id?: string
          pinned?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "clan_announcements_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_invites: {
        Row: {
          clan_id: string
          created_at: string
          expires_at: string
          id: string
          invitee_id: string
          inviter_id: string
          status: string
        }
        Insert: {
          clan_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          status?: string
        }
        Update: {
          clan_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_invites_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          clan_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          clan_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      clan_war_gifts: {
        Row: {
          clan_id: string
          coin_value: number
          created_at: string
          id: string
          sender_id: string
          war_id: string
        }
        Insert: {
          clan_id: string
          coin_value: number
          created_at?: string
          id?: string
          sender_id: string
          war_id: string
        }
        Update: {
          clan_id?: string
          coin_value?: number
          created_at?: string
          id?: string
          sender_id?: string
          war_id?: string
        }
        Relationships: []
      }
      clan_war_rounds: {
        Row: {
          ends_at: string
          id: string
          round_no: number
          war_id: string
          winner_clan_id: string | null
        }
        Insert: {
          ends_at: string
          id?: string
          round_no: number
          war_id: string
          winner_clan_id?: string | null
        }
        Update: {
          ends_at?: string
          id?: string
          round_no?: number
          war_id?: string
          winner_clan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clan_war_rounds_war_id_fkey"
            columns: ["war_id"]
            isOneToOne: false
            referencedRelation: "clan_wars"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_wars: {
        Row: {
          clan_a: string
          clan_b: string
          created_at: string
          ends_at: string | null
          id: string
          score_a: number
          score_b: number
          started_at: string | null
          status: string
          visibility: string
          winner_clan_id: string | null
        }
        Insert: {
          clan_a: string
          clan_b: string
          created_at?: string
          ends_at?: string | null
          id?: string
          score_a?: number
          score_b?: number
          started_at?: string | null
          status?: string
          visibility?: string
          winner_clan_id?: string | null
        }
        Update: {
          clan_a?: string
          clan_b?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          score_a?: number
          score_b?: number
          started_at?: string | null
          status?: string
          visibility?: string
          winner_clan_id?: string | null
        }
        Relationships: []
      }
      clans: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          level: number
          losses: number
          member_count: number
          name: string
          owner_id: string
          slug: string
          tag: string | null
          treasury_coins: number
          visibility: string
          wins: number
          xp: number
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          losses?: number
          member_count?: number
          name: string
          owner_id: string
          slug: string
          tag?: string | null
          treasury_coins?: number
          visibility?: string
          wins?: number
          xp?: number
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          losses?: number
          member_count?: number
          name?: string
          owner_id?: string
          slug?: string
          tag?: string | null
          treasury_coins?: number
          visibility?: string
          wins?: number
          xp?: number
        }
        Relationships: []
      }
      clips: {
        Row: {
          created_at: string
          duration: number
          id: string
          stream_id: string
          thumbnail_url: string | null
          title: string
          user_id: string
          video_url: string
          view_count: number
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          stream_id: string
          thumbnail_url?: string | null
          title: string
          user_id: string
          video_url: string
          view_count?: number
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          stream_id?: string
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          video_url?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "clips_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ranks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          banner_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          icon_url: string | null
          id: string
          member_count: number
          name: string
          slug: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          icon_url?: string | null
          id?: string
          member_count?: number
          name: string
          slug: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          member_count?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          rating: number
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          rating?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_ranks"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "user_ranks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      friend_invites: {
        Row: {
          context_id: string
          context_type: string
          created_at: string
          id: string
          message: string | null
          recipient_id: string
          sender_id: string
          status: string
        }
        Insert: {
          context_id: string
          context_type: string
          created_at?: string
          id?: string
          message?: string | null
          recipient_id: string
          sender_id: string
          status?: string
        }
        Update: {
          context_id?: string
          context_type?: string
          created_at?: string
          id?: string
          message?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_sends: {
        Row: {
          coin_value: number
          context_id: string | null
          context_type: string
          created_at: string
          gift_id: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          coin_value: number
          context_id?: string | null
          context_type: string
          created_at?: string
          gift_id: string
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          coin_value?: number
          context_id?: string | null
          context_type?: string
          created_at?: string
          gift_id?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      gifts_catalog: {
        Row: {
          coin_cost: number
          icon: string
          id: string
          name: string
          rarity: string
        }
        Insert: {
          coin_cost: number
          icon: string
          id?: string
          name: string
          rarity?: string
        }
        Update: {
          coin_cost?: number
          icon?: string
          id?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string
          id: string
          tag: string
          use_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          tag: string
          use_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          tag?: string
          use_count?: number
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_price: number
          item_title: string
          order_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_price: number
          item_title: string
          order_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_price?: number
          item_title?: string
          order_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ranks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ranks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          media_urls: string[] | null
          post_type: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          media_urls?: string[] | null
          post_type?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          media_urls?: string[] | null
          post_type?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ranks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          stars: number
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stars: number
          target_id: string
          target_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stars?: number
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      shorts: {
        Row: {
          created_at: string
          id: string
          thumbnail_url: string | null
          title: string | null
          user_id: string
          video_url: string
          view_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          thumbnail_url?: string | null
          title?: string | null
          user_id: string
          video_url: string
          view_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string
          video_url?: string
          view_count?: number
        }
        Relationships: []
      }
      societies: {
        Row: {
          charter_md: string | null
          created_at: string
          founder_id: string
          gov_type: string
          id: string
          invite_code: string
          name: string
          slug: string
        }
        Insert: {
          charter_md?: string | null
          created_at?: string
          founder_id: string
          gov_type?: string
          id?: string
          invite_code?: string
          name: string
          slug: string
        }
        Update: {
          charter_md?: string | null
          created_at?: string
          founder_id?: string
          gov_type?: string
          id?: string
          invite_code?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      society_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          society_id: string
          user_id: string
          voting_power: number
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          society_id: string
          user_id: string
          voting_power?: number
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          society_id?: string
          user_id?: string
          voting_power?: number
        }
        Relationships: []
      }
      society_proposals: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          ends_at: string
          id: string
          society_id: string
          status: string
          title: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          society_id: string
          status?: string
          title: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          society_id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      society_votes: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          vote: string
          voter_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          vote: string
          voter_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          vote?: string
          voter_id?: string
          weight?: number
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
          view_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
          view_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      stream_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "stream_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_polls: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          options: Json
          question: string
          stream_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          question: string
          stream_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          question?: string
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_polls_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      streams: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          is_live: boolean
          source_type: string
          source_url: string | null
          started_at: string | null
          thumbnail_url: string | null
          title: string
          user_id: string
          viewer_count: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          source_type?: string
          source_url?: string | null
          started_at?: string | null
          thumbnail_url?: string | null
          title: string
          user_id: string
          viewer_count?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          source_type?: string
          source_url?: string | null
          started_at?: string | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "streams_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_ranks"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          coins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_ranks: {
        Row: {
          avatar_url: string | null
          avg_rating: number | null
          display_name: string | null
          follower_count: number | null
          gift_coins_received: number | null
          post_count: number | null
          score: number | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          avg_rating?: never
          display_name?: string | null
          follower_count?: never
          gift_coins_received?: never
          post_count?: never
          score?: never
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          avg_rating?: never
          display_name?: string | null
          follower_count?: never
          gift_coins_received?: never
          post_count?: never
          score?: never
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_follower_count: { Args: { profile_id: string }; Returns: number }
      get_following_count: { Args: { profile_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clan_member: {
        Args: { _clan: string; _user: string }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_following: {
        Args: { follower: string; following: string }
        Returns: boolean
      }
      is_society_member: {
        Args: { _society: string; _user: string }
        Returns: boolean
      }
      send_gift: {
        Args: {
          _context_id: string
          _context_type: string
          _gift_id: string
          _recipient: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
