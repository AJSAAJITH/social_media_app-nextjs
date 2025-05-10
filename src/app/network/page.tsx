import { getFollowers, getFollowing } from '@/actions/follow.action';
import MyNetwork from '@/components/my-network';
import React from 'react';

const page = async () => {
    const followersData = await getFollowers();
    const followingData = await getFollowing();

    const followers = followersData?.map(follower => ({
        ...follower.follower,
        isFollowing: true,
        mutualConnections: follower.mutualConnections.length > 0 ? {
            count: follower.mutualConnections.length,
            users: follower.mutualConnections.map(m => ({
                name: m.name ?? "Unknown",
                username: m.username
            }))
        } : undefined
    })) || [];

    const following = followingData?.map(following => ({
        ...following.following,
        isFollowing: true
    })) || [];

    return (
        <div className="container mx-auto py-6 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">My Network</h1>
            <MyNetwork followers={followers} following={following} />
        </div>
    );
};

export default page;
