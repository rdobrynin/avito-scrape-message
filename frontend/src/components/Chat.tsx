import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export const Chat: React.FC = () => {
    const [inputMessage, setInputMessage] = useState<string>('');
    const { messages, sendMessage, isConnected, username, setUsername, error } = useWebSocket('http://localhost:9000');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputMessage.trim()) {
            sendMessage(inputMessage);
            setInputMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Avito Websocket income messages</h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className={`flex items-center ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
                                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {!username && (
                    <div className="p-6 bg-yellow-50 border-b border-yellow-200">
                        <div className="flex items-center space-x-4">
                            <div className="flex-1">
                                <label htmlFor="username" className="block text-sm font-medium text-yellow-800 mb-2">
                                    Enter your username to start chatting
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Your username..."
                                    value={username}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages Container */}
                <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="mt-2">No messages yet.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                            msg.username === username
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs font-semibold ${
                          msg.username === username ? 'text-blue-100' : 'text-blue-600'
                      }`}>
                        {msg.username}
                      </span>
                                            <span className={`text-xs ${
                                                msg.username === username ? 'text-blue-200' : 'text-gray-500'
                                            }`}>
                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                                        </div>
                                        <p className="text-sm">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Message Input */}
                {username && (
                    <div className="border-t border-gray-200 p-4 bg-white">
                        <form onSubmit={handleSubmit} className="flex space-x-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder={isConnected ? "Type your message..." : "Connecting..."}
                                    value={inputMessage}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={!isConnected}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || !isConnected}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>Logged in as <strong className="text-blue-600">{username}</strong></span>
                            <span>Press Enter to send</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
