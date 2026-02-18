import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Mail, X, MessageCircle, Clock, Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  createConversation, 
  sendMessage, 
  getConversationsForUser, 
  getMessagesForConversation,
  db,
  doc,
  getDoc
} from '../../lib/firebase';
import { UserProfile, SchoolItem, Conversation, Message } from '../types';
import { translations } from '../lib/translations';

interface MessagingSystemProps {
  currentUser: UserProfile;
  item: SchoolItem;
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ar';
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ 
  currentUser, 
  item, 
  isOpen, 
  onClose, 
  language 
}) => {
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [donorProfile, setDonorProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  const navigate = useNavigate();

  // Load donor profile
  useEffect(() => {
    const loadDonorProfile = async () => {
      try {
        const donorDoc = await getDoc(doc(db, 'users', item.donorId));
        if (donorDoc.exists()) {
          setDonorProfile(donorDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error loading donor profile:", error);
      }
    };

    if (item.donorId) {
      loadDonorProfile();
    }
  }, [item.donorId]);

  // Load existing conversation or create new one
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    
    // Look for existing conversation between these two users for this item
    const unsubscribe = getConversationsForUser(currentUser.id, (conversations) => {
      const existingConv = conversations.find(conv => 
        conv.participants.includes(item.donorId) && 
        conv.itemIds.includes(item.id)
      );

      if (existingConv) {
        setConversationId(existingConv.id);
        
        // Load messages for this conversation
        const msgUnsub = getMessagesForConversation(existingConv.id, (msgs) => {
          setMessages(msgs);
          setIsLoading(false);
        });

        return () => msgUnsub();
      } else {
        // Create new conversation
        createConversation([currentUser.id, item.donorId], [item.id])
          .then(newConvId => {
            setConversationId(newConvId);
            setMessages([]);
            setIsLoading(false);
          })
          .catch(error => {
            console.error("Error creating conversation:", error);
            setIsLoading(false);
          });
      }
    });

    return () => unsubscribe();
  }, [isOpen, currentUser.id, item.donorId, item.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId) return;

    try {
      await sendMessage(conversationId, currentUser.id, currentUser.displayName, message);
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <MessageCircle className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">{t.contactDonor || 'Contact Donor'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {item.donorName} • {item.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contact Options */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            {donorProfile?.phoneNumber && (
              <a
                href={`tel:${donorProfile.phoneNumber}`}
                className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors"
              >
                <Phone size={16} />
                {t.call || 'Call'}
              </a>
            )}
            <a
              href={`mailto:${item.donorEmail}`}
              className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
            >
              <Mail size={16} />
              {t.email || 'Email'}
            </a>
            <button
              onClick={() => navigate(`/profile/${item.donorId}`)}
              className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors"
            >
              <MessageCircle size={16} />
              {t.viewProfile || 'View Profile'}
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">{t.startConversation || 'Start a conversation'}</p>
              <p className="text-sm mt-1">{t.noMessagesYet || 'No messages yet. Be the first to say hello!'}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    msg.senderId === currentUser.id
                      ? 'bg-emerald-500 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    msg.senderId === currentUser.id ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    <span>
                      {new Date(msg.timestamp?.toDate()).toLocaleTimeString(language, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {msg.senderId === currentUser.id && (
                      <span>
                        {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.typeMessage || 'Type your message...'}
              className="flex-1 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white p-3 rounded-xl transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {t.sendMessageDetails || 'Ask about pickup location, item condition, or availability'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessagingSystem;