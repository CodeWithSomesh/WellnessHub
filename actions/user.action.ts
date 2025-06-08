"use server";

import User from "@/modals/user.modal";
import { connect } from "@/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createUser(user: any) {
  try {
    await connect();
    console.log("Connected to MongoDB Database successfully, creating user now...");
    const newUser = await User.create(user);
    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    console.log(error);
  }
}