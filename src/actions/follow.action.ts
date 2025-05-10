"use server";

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.actions";
import { revalidatePath } from "next/cache";

export async function getFollowers() {
    try {
        const userId = await getDbUserId();
        if (!userId) return null;

        // First get who the current user follows
        const userFollowing = await prisma.follows.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });
        const userFollowingIds = userFollowing.map(f => f.followingId);

        const followers = await prisma.follows.findMany({
            where: { followingId: userId },
            include: {
                follower: {
                    include: {
                        followers: {
                            select: {
                                follower: {
                                    select: {
                                        id: true,
                                        name: true,
                                        username: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return followers.map(follow => {
            // Find mutual connections (people who follow this user and you also follow)
            const mutuals = follow.follower.followers
                .filter(f => userFollowingIds.includes(f.follower.id) && f.follower.id !== userId)
                .map(f => f.follower);

            return {
                follower: {
                    ...follow.follower,
                    _count: { followers: follow.follower.followers.length }
                },
                mutualConnections: mutuals
            };
        });
    } catch (error) {
        console.error("Error fetching followers:", error);
        return null;
    }
}

export async function getFollowing() {
    try {
        const userId = await getDbUserId();
        if (!userId) return null;

        const following = await prisma.follows.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    include: {
                        _count: {
                            select: { followers: true }
                        }
                    }
                }
            }
        });

        return following.map(f => ({
            following: f.following,
            _count: f.following._count
        }));
    } catch (error) {
        console.error("Error fetching following:", error);
        return null;
    }
}


export async function toggleFollow(targetUserId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        // Check if follow relationship exists
        const existingFollow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId,
                },
            },
        });

        if (existingFollow) {
            // Unfollow
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId,
                    },
                },
            });
        } else {
            // Follow and create notification (only if following someone else)
            await prisma.$transaction([
                // Create follow relationship
                prisma.follows.create({
                    data: {
                        followerId: userId,
                        followingId: targetUserId,
                    },
                }),

                // Create notification if not following yourself
                ...(userId !== targetUserId
                    ? [
                        prisma.notification.create({
                            data: {
                                type: "FOLLOW",
                                userId: targetUserId, // Recipient (user being followed)
                                creatorId: userId, // Person who followed
                            },
                        }),
                    ]
                    : []),
            ]);
        }

        revalidatePath('/network'); // Revalidate the network page
        return { success: true };

    } catch (error) {
        console.error("Failed to toggle follow:", error);
        return { success: false, error: "Failed to toggle follow" };
    }
}