export interface ChatRoom {
  chatRoomId: string,
  users: User[], // max 2
  messages?: Message[],
}
interface User {
  userId: string,
  userName: string,
}

interface UserInDatabase {
  userId: string,
  userName: string,
  password: string,
}

interface Message {
  fromUserId: string,
  fromUserName: string,
  content: string,
  timestamp: number,
}