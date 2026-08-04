import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import { MessageSquare, Clock, User as UserIcon, CheckCircle, Search, Inbox, ChevronRight } from "lucide-react";
import ChatModal from "../../components/Chat/ChatModal";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DOCTOR_TOKEN_KEY = "doctorToken_v1";

export default function Messages() {
  const { isSignedIn, getToken, userId } = useAuth();
  const { user } = useUser();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ChatModal state
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem(DOCTOR_TOKEN_KEY));
    } catch {
      return false;
    }
  });

  const fetchConversations = async () => {
    try {
      let headers = { "Content-Type": "application/json" };
      if (isSignedIn) {
        const token = await getToken();
        headers.Authorization = `Bearer ${token}`;
      } else if (isDoctorLoggedIn) {
        const docToken = localStorage.getItem(DOCTOR_TOKEN_KEY);
        headers.Authorization = `Bearer ${docToken}`;
      } else {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/messages/conversations`, { headers });
      const json = await res.json();
      if (json.success) {
        setConversations(json.conversations || []);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Poll every 10 seconds for new messages
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [isSignedIn, isDoctorLoggedIn]);

  const handleOpenChat = (apptId, recipientName) => {
    setSelectedApptId(apptId);
    setSelectedRecipient(recipientName);
    setIsChatOpen(true);
    
    // Clear unread count locally immediately
    setConversations(prev => prev.map(conv => {
      if (conv.appointmentId === apptId) {
        return { ...conv, unreadCount: 0 };
      }
      return conv;
    }));
  };

  const filteredConversations = conversations.filter(conv => 
    conv.otherPartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.latestMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      {/* Header */}
      <div className="bg-emerald-800 text-white pt-24 pb-12 px-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-emerald-300" />
                Message Center
              </h1>
              <p className="text-emerald-100 mt-2 max-w-lg leading-relaxed text-sm">
                Securely manage your telehealth consultations. Communicate with your {isSignedIn ? "doctors" : "patients"} and review your shared medical files.
              </p>
            </div>
            
            <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-sm border border-white/20 flex items-center max-w-sm w-full md:w-auto focus-within:bg-white/20 transition">
              <Search className="w-5 h-5 text-emerald-100 ml-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-white placeholder:text-emerald-200 px-3 py-2 w-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 -mt-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[500px]">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-sm">Loading conversations...</p>
            </div>
          ) : !isSignedIn && !isDoctorLoggedIn ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500 space-y-4 px-6 text-center">
              <UserIcon className="w-16 h-16 text-slate-300" />
              <p className="text-lg font-bold text-slate-700">Authentication Required</p>
              <p className="text-sm">Please log in as a patient or doctor to view your messages.</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500 space-y-4 px-6 text-center bg-slate-50">
              <Inbox className="w-16 h-16 text-slate-300" />
              <p className="text-lg font-bold text-slate-700">Your Inbox is Empty</p>
              <p className="text-sm max-w-sm">You don't have any active telehealth conversations yet. Messages from appointments will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-slate-500 font-medium">
                  No conversations matched your search.
                </div>
              )}
              
              {filteredConversations.map((conv) => (
                <div 
                  key={conv.appointmentId} 
                  onClick={() => handleOpenChat(conv.appointmentId, conv.otherPartyName)}
                  className={`p-5 flex items-center justify-between gap-4 cursor-pointer transition-colors group ${
                    conv.unreadCount > 0 ? "bg-emerald-50/50 hover:bg-emerald-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm ${
                        isSignedIn ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
                      }`}>
                        {conv.otherPartyName.charAt(0)}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 truncate">
                        {conv.otherPartyName}
                        {conv.unreadCount > 0 && <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>}
                      </h3>
                      <p className={`text-sm truncate mt-0.5 ${conv.unreadCount > 0 ? "text-slate-800 font-bold" : "text-slate-500"}`}>
                        {conv.latestMessage.senderName === conv.otherPartyName ? "" : "You: "}{conv.latestMessage.content}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {new Date(conv.latestMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 cursor-pointer">
                      Open <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isChatOpen && selectedApptId && (
        <ChatModal 
          isOpen={isChatOpen} 
          onClose={() => {
            setIsChatOpen(false);
            fetchConversations(); // refresh unread status if they got new messages while open
          }}
          appointmentId={selectedApptId} 
          senderRole={isSignedIn ? "patient" : "doctor"}
          recipientName={selectedRecipient}
        />
      )}
    </div>
  );
}
