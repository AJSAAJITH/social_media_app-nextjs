"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { toggleFollow } from "@/actions/user.actions";
import Link from "next/link";

type User = {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    bio: string | null;
    isFollowing: boolean;
    mutualConnections?: {
        count: number;
        users: {
            name: string | null;
            username: string;
        }[];
    };
};

type NetworkProps = {
    followers: User[];
    following: User[];
    className?: string;
};

export default function MyNetwork({ followers, following, className }: NetworkProps) {
    const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
    const [followersData, setFollowersData] = useState<User[]>(followers);
    const [followingData, setFollowingData] = useState<User[]>(following);

    const handleToggleFollow = async (userId: string, type: "followers" | "following") => {
        try {
            if (type === "followers") {
                setFollowersData(prev =>
                    prev.map(user =>
                        user.id === userId
                            ? { ...user, isFollowing: !user.isFollowing }
                            : user
                    )
                );
            } else {
                setFollowingData(prev =>
                    prev.map(user =>
                        user.id === userId
                            ? { ...user, isFollowing: !user.isFollowing }
                            : user
                    )
                );
            }

            const result = await toggleFollow(userId);
            if (!result?.success) {
                if (type === "followers") {
                    setFollowersData(followers);
                } else {
                    setFollowingData(following);
                }
            }
        } catch {
            if (type === "followers") {
                setFollowersData(followers);
            } else {
                setFollowingData(following);
            }
        }
    };

    const renderUserCard = (user: User, type: "followers" | "following") => (
        <div
            key={user.id}
            className="flex items-start gap-4 p-4 border-b hover:bg-muted/25 transition-colors"
        >
            <Link href={`/profile/${user.username}`} className="flex-shrink-0">
                <Avatar className="h-12 w-12 mt-1">
                    <AvatarImage src={user.image ?? "/placeholder.svg?height=48&width=48"} alt={user.name ?? "User"} />
                    <AvatarFallback>{(user.name ?? "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
            </Link>

            <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-medium">{user.name ?? "Unknown User"}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>

                        {type === "followers" && user.mutualConnections && user.mutualConnections?.count > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                                <div className="flex -space-x-2">
                                    {user.mutualConnections.users.slice(0, 2).map((mutual, idx) => (
                                        <Avatar key={idx} className="h-5 w-5 border-2 border-background">
                                            <AvatarFallback className="text-[10px]">
                                                {(mutual.name ?? "U").substring(0, 1).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {user.mutualConnections.count} mutual connection
                                    {user.mutualConnections.count !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                    </div>
                    <Button
                        variant={user.isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleFollow(user.id, type)}
                        className="ml-2 whitespace-nowrap"
                    >
                        {user.isFollowing ? "Following" : "Follow"}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={cn("space-y-4", className)}>
            <Card>
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle>My Network</CardTitle>
                        <span className="text-sm text-muted-foreground">
                            {activeTab === "followers"
                                ? `${followersData.length} followers`
                                : `${followingData.length} following`}
                        </span>
                    </div>
                </CardHeader>

                <Tabs
                    defaultValue="followers"
                    onValueChange={(value) => setActiveTab(value as "followers" | "following")}
                    className="w-full"
                >
                    <div className="border-b">
                        <TabsList className="w-full rounded-none h-12 bg-transparent border-b">
                            <TabsTrigger
                                value="followers"
                                className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
                            >
                                Followers
                            </TabsTrigger>
                            <TabsTrigger
                                value="following"
                                className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
                            >
                                Following
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="followers" className="p-0 m-0">
                        <CardContent className="p-0">
                            <ScrollArea className="h-[calc(100vh-12rem)]">
                                {followersData.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <p className="mb-2">No followers yet</p>
                                        <p className="text-sm">When people follow you, they&apos;ll appear here.</p>
                                    </div>
                                ) : (
                                    followersData.map(user => renderUserCard(user, "followers"))
                                )}
                            </ScrollArea>
                        </CardContent>
                    </TabsContent>

                    <TabsContent value="following" className="p-0 m-0">
                        <CardContent className="p-0">
                            <ScrollArea className="h-[calc(100vh-12rem)]">
                                {followingData.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <p className="mb-2">You&apos;re not following anyone yet</p>
                                        <p className="text-sm">When you follow people, they&apos;ll appear here.</p>
                                    </div>
                                ) : (
                                    followingData.map(user => renderUserCard(user, "following"))
                                )}
                            </ScrollArea>
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
