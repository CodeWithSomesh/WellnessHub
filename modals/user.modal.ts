import {Schema, model, models} from "mongoose";

const UserSchema = new Schema({
    clerkID: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    }, 
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
})

const User = models?.User || model("User", UserSchema);

export default User;