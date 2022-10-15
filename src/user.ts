import { User as UserType } from "./types";
import crypto from "crypto";

class User {
  userId: string;
  userName: string;

  constructor(userName: string, userId?: string, ) {
    // If userId is not provided, generate one
    if (!userId) this.userId = generateRandomUserId();
    else this.userId = userId;
  
    this.userName = userName;
  }

  getUserId() {
    return this.userId;
  }

  getUserName() {
    return this.userName;
  }

  getUserDetails(): UserType {
    return {
      userId: this.userId,
      userName: this.userName,
    }
  }
}

const generateRandomUserId = () => {
  return [5, 4, 3].map((bytes) => crypto.randomBytes(bytes).toString("hex")).join("-");
}

export { User }
