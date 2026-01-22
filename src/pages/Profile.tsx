import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import coverImage from "@/assets/storyboard-image.avif";
import avatarImage from "@/assets/team-member-1.png";

type MockPost = {
  id: string;
  displayName: string;
  handle: string;
  time: string;
  content: string;
  stats: { replies: number; reposts: number; likes: number; views: string };
};

export default function ProfilePage() {
  const { handle } = useParams();
  const safeHandle = (handle ?? "sigma").replace(/^@/, "");

  const [isFollowing, setIsFollowing] = useState(false);

  const posts = useMemo<MockPost[]>(
    () => [
      {
        id: "p1",
        displayName: "SIGMA",
        handle: safeHandle,
        time: "2h",
        content:
          "Building an X-style profile page layout—cover, avatar overlap, tabs, and a clean post list. Mocked data for now.",
        stats: { replies: 18, reposts: 41, likes: 312, views: "12.4K" },
      },
      {
        id: "p2",
        displayName: "SIGMA",
        handle: safeHandle,
        time: "1d",
        content:
          "Next: wire this up to real users + posts in Lovable Cloud, then follow/unfollow.",
        stats: { replies: 7, reposts: 12, likes: 98, views: "5.1K" },
      },
    ],
    [safeHandle],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-3xl">
        <header className="border-b">
          <div className="relative">
            <div className="aspect-[3/1] w-full overflow-hidden bg-muted">
              <img
                src={coverImage}
                alt="Profile cover"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="px-4">
              <div className="-mt-10 flex items-end justify-between gap-4">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={avatarImage} alt={`${safeHandle} avatar`} />
                  <AvatarFallback>{safeHandle.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  className="min-w-28"
                  onClick={() => setIsFollowing((v) => !v)}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </div>

              <div className="py-4">
                <h1 className="text-xl font-semibold leading-tight">SIGMA</h1>
                <p className="text-sm text-muted-foreground">@{safeHandle}</p>

                <p className="mt-3 text-sm leading-relaxed">
                  Product studio / creative lab. Shipping fast, iterating faster.
                </p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>Joined January 2026</span>
                  <span>
                    <span className="font-medium text-foreground">128</span> Following
                  </span>
                  <span>
                    <span className="font-medium text-foreground">4,302</span> Followers
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-3">
            <Tabs defaultValue="posts">
              <TabsList className="w-full justify-between">
                <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                <TabsTrigger value="replies" className="flex-1">Replies</TabsTrigger>
                <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
                <TabsTrigger value="likes" className="flex-1">Likes</TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-4">
                <div className="space-y-3">
                  {posts.map((p) => (
                    <Card key={p.id} className="bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarImage} alt={`${p.handle} avatar`} />
                            <AvatarFallback>{p.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="font-semibold">{p.displayName}</span>
                              <span className="text-sm text-muted-foreground">@{p.handle}</span>
                              <span className="text-sm text-muted-foreground">·</span>
                              <span className="text-sm text-muted-foreground">{p.time}</span>
                            </div>

                            <p className="mt-2 text-sm leading-relaxed">{p.content}</p>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>{p.stats.replies} Replies</span>
                              <span>{p.stats.reposts} Reposts</span>
                              <span>{p.stats.likes} Likes</span>
                              <span>{p.stats.views} Views</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="replies" className="mt-4">
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Mocked for now — we’ll render replies once posts are real.
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="mt-4">
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Mocked for now — media grid will go here.
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="likes" className="mt-4">
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Mocked for now — liked posts will show here.
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </header>
      </main>
    </div>
  );
}
