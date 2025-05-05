import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent } from "../ui/card";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { LinkIcon, MapPinIcon } from "lucide-react";
import UnAuthenticatedSidebar from "./UnAuthenticatedSidebar";
import { getUserByClerkId } from "@/actions/user.actions";

export const Sidebar = async () => {
    const authUser = await currentUser();
    if (!authUser) return <UnAuthenticatedSidebar />

    // console.log("äuthuser", authUser)

    const user = await getUserByClerkId(authUser.id); // POST
    if (!user) {
        console.log("User not found in the database");
    }

    // console.log(user);

    return (
        <div className='sticky top-20'>
            <Card>
                <CardContent className='pt-6'>
                    <div className='flex flex-col items-center text-center'>
                        <Link href={`/profile/${authUser.username ?? authUser.emailAddresses[0]?.emailAddress.split('@')[0]}`}
                            className='flex flex-col items-center justify-center'>
                            <Avatar className='w-20 h-20 border-2'>
                                <AvatarImage src={user?.image || "https://github.com/shadcn.png"} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <div className='mt-4 space-y-1'>
                                <h3 className='font-semibold'>{user?.name}</h3>
                                <p className='text-sm text-muted-foreground'>{user?.username}</p>
                            </div>
                        </Link>
                        {user?.bio && <p className='mt-3 text-sm text-muted-foreground'>{user.bio}</p>}

                        <div className='w-full'>
                            <Separator className='my-4' />
                            <div className='flex justify-between'>
                                <div>
                                    <p className='font-medium'>{user?._count.following}</p>
                                    <p className='text-xs text-muted-foreground'>Following</p>
                                </div>
                                <Separator orientation='vertical' />
                                <div>
                                    <p className='font-medium'>{user?._count.followers}</p>
                                    <p className='text-xs text-muted-foreground'>Followers</p>
                                </div>
                            </div>
                            <Separator className='my-4' />
                        </div>

                        <div className='w-full space-y-2 text-sm'>
                            <div className='flex items-center text-muted-foreground'>
                                <MapPinIcon className='w-4 h-4 mr-2' />
                                {user?.location || "No location"}
                            </div>
                            <div className='flex items-center text-muted-foreground'>
                                <LinkIcon className='w-4 h-4 mr-2' />
                                {user?.website ? (
                                    <a href={`${user.website}`} className='hover:underline' target='_blank'>
                                        website
                                    </a>
                                ) : (
                                    "No website"
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
