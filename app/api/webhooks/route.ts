import { createUser } from '@/actions/user.action'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const CLERK_WEBHOOK_SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if(!CLERK_WEBHOOK_SIGNING_SECRET){
      throw new Error(
        "Error: Please add CLERK_WEBHOOK_SIGNING_SECRET from Clerk Dashboard to .env or .env.local"
      );
    }


    const evt = await verifyWebhook(req)

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data
    const eventType = evt.type
    console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
    console.log('Webhook payload:', evt.data)

    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name } = evt.data;
  
      const user = {
        clerkId: id,
        email: email_addresses[0].email_address,
        firstName: first_name,
        lastName: last_name,
      };
  
      console.log(user);
  
      const newUser = await createUser(user);
  
      // if (newUser) {
      //   await clerkClient.users.updateUserMetadata(id, {
      //     publicMetadata: {
      //       userId: newUser._id,
      //     },
      //   });
      // }
      console.log('New user created successfully')
      return NextResponse.json({ message: "New user created", user: newUser });
    }

    return new Response('Webhook received', { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}