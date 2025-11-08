export interface IChatInfo {
  username: string;
  messages: IAvitoMessage[];
  totalMessages: number;
}

interface IAvitoMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isUnread: boolean;
}
