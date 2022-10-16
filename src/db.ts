import { MongoClient } from "mongodb";
import { Db, Collection, ChangeStreamUpdateDocument, ChangeStream } from "mongodb/mongodb";
import { ChatRoom, Message } from "./types";
import { User } from "./user";
import { UserInDatabase } from "./types"
import crypto from "crypto";

// Initialise dotenv for environment variables
import * as dotenv from "dotenv";
dotenv.config();

let client: MongoClient;
let database: Db;
let chatRooms: Collection<ChatRoom>;
let users: Collection<UserInDatabase>;
let changeStream: ChangeStream<ChatRoom, ChangeStreamUpdateDocument<Record<string, Message>>>;

export const connectToDatabase = () => {
  client = new MongoClient(process.env.CONN_STRING);
  database = client.db("Tchat");
  
  chatRooms = database.collection<ChatRoom>("ChatRooms");
  users = database.collection<UserInDatabase>("Users");
}

export const createChatRoom = async (user: User) => {
  // Generate random chat room ID e.g. 3VQAPMYG
  const chatRoomId = generateChatRoomId();
  const { userId, userName } = user.getUserDetails();

  await chatRooms.insertOne(
    {
      chatRoomId,
      users: [
        {
          userId,
          userName,
        }
      ],
      messages: [],
    }
  );

  return chatRoomId;
}

export const checkIfChatRoomExists = async (chatRoomId: string) => {
  return !!(await chatRooms.count({ chatRoomId }, { limit: 1 }))
}

export const getChatRoomDetails = async (chatRoomId: string) => {
  const result = await chatRooms.findOne(
    { chatRoomId }
  )

  return result;
}

export const addUserToChatRoom = async (user: User, chatRoomId: string) => {
  const result = await chatRooms.updateOne(
    {
      chatRoomId 
    },
    { 
      $addToSet: { 
          users: user.getUserDetails() 
        } 
    }
  );

  return result.modifiedCount >= 1;
}

export const userSignUp = async (user: User, password: string) => {
  const { userId, userName } = user.getUserDetails();

  const result = await users.updateOne(
    {
      userName,
    },
    { $set: {
        userId,
        userName,
        password: hashPassword(password),
      },
    },
    {
      upsert: true,
    }
  )

  return result.upsertedCount >= 1;
}

export const userSignIn = async (userName: string, password: string) => {
  const hashedPassword = hashPassword(password);

  const result = await users.findOne({
    userName,
    password: hashedPassword,
  })

  return result;
}

export const messageListener = (chatRoomId: string) => {
  const pipeline = [
    { 
      $match: { 
          "fullDocument.chatRoomId": chatRoomId 
        } 
    },
    {
      $project: {
        "fullDocument.messages": false,
        "fullDocument.users": false,
      }
    }
  ];
  changeStream = chatRooms.watch<ChatRoom, ChangeStreamUpdateDocument<Record<string, Message>>>(pipeline, { fullDocument: "updateLookup" });
  
  return changeStream;
}

export const sendMessage = async (chatRoomId: string, user: User, content: string) => {
  const { userId, userName } = user.getUserDetails();

  const result = await chatRooms.updateOne(
    { chatRoomId },
    { $push: { 
        "messages": { 
          fromUserId: userId,
          fromUserName: userName,
          content, 
          timestamp: new Date().getTime() 
        } 
      } 
    }
  )
  
  return result.modifiedCount >= 1;;
}

export const closeDatabase = () => {
  changeStream.close();
  client.close();
}

const generateChatRoomId = () => {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

const hashPassword = (password: string) => {
  return crypto.createHash("SHA256").update(password).digest("hex");
}
