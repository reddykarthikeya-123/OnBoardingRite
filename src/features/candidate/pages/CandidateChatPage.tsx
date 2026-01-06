import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Send,
    Sparkles,
    FileText,
    MessageCircle,
    User,
    Check,
    CheckCheck,
    Paperclip,
    Smile,
    Bell
} from 'lucide-react';
import { mockTeamMembers } from '../../../data';

// Get a mock candidate for demo purposes
const mockCandidate = mockTeamMembers[0];

// Mock chat messages
const initialMessages = [
    {
        id: 'msg-001',
        sender: 'hr',
        text: `Hi ${mockCandidate.firstName}! Welcome to the team. I'm ${mockCandidate.assignedProcessorName}, your HR Lead for the onboarding process.`,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        read: true
    },
    {
        id: 'msg-002',
        sender: 'hr',
        text: 'I see you\'ve already completed several tasks. Great progress! Let me know if you have any questions.',
        timestamp: new Date(Date.now() - 86400000 * 2 + 60000).toISOString(),
        read: true
    },
    {
        id: 'msg-003',
        sender: 'candidate',
        text: 'Thank you! I do have a question about the W-4 form. Should I claim allowances?',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        read: true
    },
    {
        id: 'msg-004',
        sender: 'hr',
        text: 'Great question! For the W-4, I\'d recommend consulting a tax professional for personalized advice. However, most new employees start with the standard deduction. Would you like me to send you some resources?',
        timestamp: new Date(Date.now() - 86400000 + 300000).toISOString(),
        read: true
    },
    {
        id: 'msg-005',
        sender: 'candidate',
        text: 'Yes, that would be helpful! Thank you.',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
        read: true
    },
    {
        id: 'msg-006',
        sender: 'hr',
        text: 'I\'ve just sent you an email with W-4 guidelines. Also, don\'t forget your drug test is scheduled for tomorrow at 9 AM at the clinic on Main Street.',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
        read: true
    },
];

const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

const formatDateHeader = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
};

export function CandidateChatPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState(initialMessages);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage = {
            id: `msg-${Date.now()}`,
            sender: 'candidate',
            text: inputText.trim(),
            timestamp: new Date().toISOString(),
            read: false
        };

        setMessages([...messages, newMessage]);
        setInputText('');

        // Simulate HR typing response after a delay
        setTimeout(() => {
            const responses = [
                "Got it! I'll look into that for you.",
                "Thanks for letting me know. I'll get back to you shortly.",
                "Great question! Let me check and follow up.",
                "Understood. I'll send you the details via email.",
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            setMessages(prev => [...prev, {
                id: `msg-${Date.now()}`,
                sender: 'hr',
                text: randomResponse,
                timestamp: new Date().toISOString(),
                read: true
            }]);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: typeof messages }[] = [];
    messages.forEach(msg => {
        const dateKey = new Date(msg.timestamp).toDateString();
        const existingGroup = groupedMessages.find(g => g.date === dateKey);
        if (existingGroup) {
            existingGroup.messages.push(msg);
        } else {
            groupedMessages.push({ date: dateKey, messages: [msg] });
        }
    });

    return (
        <div className="candidate-chat">
            {/* Chat Header */}
            <header className="candidate-chat-header">
                <button
                    className="candidate-v2-back-btn"
                    onClick={() => navigate('/candidate-v2')}
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="candidate-chat-hr-info">
                    <div className="candidate-chat-hr-avatar">
                        {mockCandidate.assignedProcessorName?.split(' ').map(n => n[0]).join('')}
                        <span className="candidate-chat-online-indicator" />
                    </div>
                    <div className="candidate-chat-hr-details">
                        <h2 className="candidate-chat-hr-name">{mockCandidate.assignedProcessorName}</h2>
                        <span className="candidate-chat-hr-role">HR Lead • Online</span>
                    </div>
                </div>
                <div className="candidate-chat-header-actions">
                    {/* Placeholder for future actions */}
                </div>
            </header>

            {/* Messages Area */}
            <div className="candidate-chat-messages">
                {groupedMessages.map((group) => (
                    <div key={group.date} className="candidate-chat-date-group">
                        <div className="candidate-chat-date-divider">
                            <span>{formatDateHeader(group.messages[0].timestamp)}</span>
                        </div>
                        {group.messages.map((message, index) => {
                            const isCandidate = message.sender === 'candidate';
                            const showAvatar = !isCandidate &&
                                (index === 0 || group.messages[index - 1].sender === 'candidate');

                            return (
                                <div
                                    key={message.id}
                                    className={`candidate-chat-message ${isCandidate ? 'sent' : 'received'}`}
                                >
                                    {!isCandidate && showAvatar && (
                                        <div className="candidate-chat-message-avatar">
                                            {mockCandidate.assignedProcessorName?.split(' ').map(n => n[0]).join('')}
                                        </div>
                                    )}
                                    {!isCandidate && !showAvatar && (
                                        <div className="candidate-chat-message-avatar-spacer" />
                                    )}
                                    <div className="candidate-chat-bubble">
                                        <p>{message.text}</p>
                                        <div className="candidate-chat-message-meta">
                                            <span className="candidate-chat-time">
                                                {formatMessageTime(message.timestamp)}
                                            </span>
                                            {isCandidate && (
                                                <span className="candidate-chat-read-status">
                                                    {message.read ? <CheckCheck size={14} /> : <Check size={14} />}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="candidate-chat-input-area">
                <div className="candidate-chat-input-container">
                    <button className="candidate-chat-input-action" title="Attach file">
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="candidate-chat-input"
                    />
                    <button className="candidate-chat-input-action" title="Add emoji">
                        <Smile size={20} />
                    </button>
                    <button
                        className={`candidate-chat-send-btn ${inputText.trim() ? 'active' : ''}`}
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

            {/* Bottom Navigation */}
            <nav className="candidate-v2-bottom-nav">
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate-v2')}
                >
                    <Sparkles size={22} />
                    <span>Home</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate-v2/tasks')}
                >
                    <FileText size={22} />
                    <span>Tasks</span>
                </button>
                <button className="candidate-v2-nav-item active">
                    <MessageCircle size={22} />
                    <span>Chat</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate/notifications')}
                >
                    <Bell size={22} />
                    <span>Alerts</span>
                </button>
                <button
                    className="candidate-v2-nav-item"
                    onClick={() => navigate('/candidate/profile')}
                >
                    <User size={22} />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
}
