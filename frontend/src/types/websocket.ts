// types/websocket.ts
export interface Message {
    username: string;
    message: string;
    timestamp?: Date;
}

export interface WebSocketHook {
    messages: Message[];
    sendMessage: (message: string) => void;
    isConnected: boolean;
    username: string;
    setUsername: (username: string) => void;
    error: string | null;
}
