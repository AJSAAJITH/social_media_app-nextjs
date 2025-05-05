"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

//post sync clerk with db
export async function syncUser() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) return;

        // Check if a user with this Clerk ID exists
        let existingUser = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (existingUser) return existingUser;

        // If not found by Clerk ID, check by email
        const email = user.emailAddresses[0].emailAddress;
        existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            // Update the user with the clerkId if it exists by email but not linked
            return await prisma.user.update({
                where: { email },
                data: {
                    clerkId: userId
                }
            });
        }

        //  Create new user
        const dbUser = await prisma.user.create({
            data: {
                clerkId: userId,
                name: `${user.firstName || ""} ${user.lastName || ""}`,
                username: user.username ?? email.split('@')[0],
                email: email,
                image: user.imageUrl,
            }
        });

        return dbUser;

    } catch (error) {
        console.error("Error syncing user:", error);
        return null;
    }
}


//get current user
export async function getUserByClerkId(clerkId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                clerkId,
            },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                    }
                }
            }
        })
        return user;
    } catch (error) {
        console.log("Error getting user by clerkId:", error);
        return null;
    }
}

// get db user using clerk Id
export async function getDbUserId() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    const user = await getUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    return user.id;
}

// get 3 random users exclude ourselves & users that we already follow
export async function getRandomUsers() {
    try {
        const userId = await getDbUserId();
        if (!userId) return [];

        // get 3 random users exclude ourselves & users that we already follow
        const randomUsers = await prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: userId } },
                    {
                        NOT: {
                            followers: {
                                some: {
                                    followerId: userId,
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                _count: {
                    select: {
                        followers: true,
                    }
                }
            },
            take: 3,
        });

        return randomUsers;

    } catch (error) {
        console.log("Error fetching random users", error);
        return [];
    }
}

export async function toggleFollow(targetUserId: string) {
    try {

        const userId = await getDbUserId();
        if (!userId) return;

        if (userId === targetUserId) throw new Error("You cannot follow yourself");

        const existingFollow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId,
                },
            },
        });

        if (existingFollow) {
            // then unfollow
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId,
                    },
                },
            });

        } else {
            // if not exist - follow 
            await prisma.$transaction([
                prisma.follows.create({
                    data: {
                        followerId: userId,
                        followingId: targetUserId,
                    },
                }),

                prisma.notification.create({
                    data: {
                        type: "FOLLOW",
                        userId: targetUserId,
                        creatorId: userId
                    },
                }),
            ]);
        }

        revalidatePath("/");
        return { success: true };

    } catch (error) {
        console.error("Error in toggle follow:", error);
        return { success: false, error: "Error in toggle follow" };
    }
}

