import React from 'react'

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

const UnAuthenticatedSidebar = () => {
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className='text-center text-xl font-semibold'>welcome Back!</CardTitle>

                </CardHeader>
                <CardContent>
                    <p className='text-center text-muted-foreground mb-4'>Login to access your profile and connect with others.</p>
                    <SignInButton mode="modal" >
                        <Button className='w-full mt-2' variant={'outline'}>
                            Sign In
                        </Button>
                    </SignInButton>
                    <SignUpButton mode="modal" >
                        <Button className='w-full mt-2' variant={'default'}>
                            Sign Up
                        </Button>
                    </SignUpButton>
                </CardContent>
            </Card>

        </div>
    )
}

export default UnAuthenticatedSidebar