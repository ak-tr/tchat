import * as types from "./types";

class User {
  userId: string;
  userName: string;

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
  }

  getUserId() {
    return this.userId;
  }

  getUserName() {
    return this.userName;
  }

  getUserDetails(): types.User {
    return {
      userId: this.userId,
      userName: this.userName,
    }
  }
}

export { User }
