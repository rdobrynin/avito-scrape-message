import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, WebSocketHook } from '../types/websocket';

export const useWebSocket = (url: string): WebSocketHook => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isError, ] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        try {
            socketRef.current = io(url, {
                timeout: 5000,
                transports: ['websocket', 'polling']
            });

            socketRef.current.on('connect', () => {
                setIsConnected(true);
                setError(null);
                console.log('Connected to WebSocket server');
            });

            socketRef.current.on('disconnect', () => {
                setIsConnected(false);
                console.log('Disconnected from WebSocket server');
            });

            socketRef.current.on('connect_error', (err) => {
                setError(`Connection error: ${err.message}`);
                setIsConnected(false);
            });

            socketRef.current.on('message', (newMessage: Message) => {
                setMessages(prev => [...prev, { ...newMessage, timestamp: new Date() }]);
            });

        } catch (err) {
            console.log(err)
            setError('Failed to initialize WebSocket connection');
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [url]);

    const sendMessage = useCallback((message: string) => {
        if (!socketRef.current || !isConnected) {
            setError('Not connected to server');
            return;
        }

        if (!username.trim()) {
            setError('Please set a username first');
            return;
        }

        if (!message.trim()) {
            setError('Message cannot be empty');
            return;
        }

        try {
            const messageData: Message = {
                username,
                message,
                isError,
                timestamp: new Date()
            };
            socketRef.current.emit('sendMessage', messageData);
            setError(null);
        } catch (err) {
            console.log(err)
            setError('Failed to send message');
        }
    }, [username, isConnected]);

    return {
        messages,
        sendMessage,
        isConnected,
        username,
        setUsername,
        error
    };
};
