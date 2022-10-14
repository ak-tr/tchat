import { MongoClient } from "mongodb";
import { Db, Collection } from "mongodb/mongodb";
import { ChatRoom } from "./types";

// Initialise dotenv for environment variables
import * as dotenv from "dotenv";
dotenv.config();

let client: MongoClient;
let database: Db;
let chatRooms: Collection<ChatRoom>;

export const connectToDatabase = () => {
  client = new MongoClient(process.env.CONN_STRING);
  database = client.db("Tchat");
  
  // Access ChatRooms collection on database
  // Collection on MongoDB acts as server
  chatRooms = database.collection<ChatRoom>("ChatRooms")
}

export const createChatRoom = async (userId: string, userName: string) => {
  // Generate random chat room ID e.g. 3VQAPMYG
  const chatRoomId = generateChatRoomId();

  const result = await chatRooms.insertOne({
    chatRoomId,
    users: [
      {
        userId,
        userName,
      }
    ],
    messages: [],
  })

  console.log(`New chat room created with ID ${result.insertedId}`);
}

export const sendMessage = async (chatRoomId: string, userId: string, content: string) => {
  const result = await chatRooms.updateOne(
    { chatRoomId },
    { $push: { "messages": { fromUserId: userId, content } } }
  )
  
  return result.modifiedCount >= 1;;
}

export const closeDatabase = () => {
  client.close();
}

const generateChatRoomId = () => {
  return (Math.random() + 1).toString(36).substring(5).toUpperCase();
}