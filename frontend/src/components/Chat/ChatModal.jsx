import React, { useEffect, useState, useRef } from "react";
import { Send, User, MessageSquare, RefreshCw, Activity, Upload, Trash2, ZoomIn, ZoomOut, RotateCw, Eye, Download, Folder } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DOCTOR_TOKEN_KEY = "doctorToken_v1";

export default function ChatModal({ isOpen, onClose, appointmentId, senderRole, recipientName }) {
  const { isSignedIn, getToken, userId } = useAuth();
  
  // Tabs & Messaging state
  const [activeTab, setActiveTab] = useState("chat"); // "chat" or "locker"
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // File Locker state
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadFileObj, setUploadFileObj] = useState(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Lightbox viewer state
  const [viewingFile, setViewingFile] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotateAngle, setRotateAngle] = useState(0);
  
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Poll for messages when tab is chat
  useEffect(() => {
    if (isOpen && appointmentId && activeTab === "chat") {
      fetchMessages(true);
      
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(false);
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isOpen, appointmentId, activeTab]);

  // Fetch files when tab is locker
  useEffect(() => {
    if (isOpen && appointmentId && activeTab === "locker") {
      fetchFiles();
    }
  }, [isOpen, appointmentId, activeTab]);

  // Scroll to bottom helper
  useEffect(() => {
    if (messages.length > 0 && activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const getAuthHeaders = async () => {
    let headers = { "Content-Type": "application/json" };
    if (senderRole === "patient") {
      if (isSignedIn) {
        const token = await getToken();
        headers.Authorization = `Bearer ${token}`;
      }
    } else if (senderRole === "doctor") {
      const docToken = localStorage.getItem(DOCTOR_TOKEN_KEY);
      if (docToken) {
        headers.Authorization = `Bearer ${docToken}`;
      }
    }
    return headers;
  };

  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/messages/${appointmentId}`, { headers });
      const json = await res.json();
      if (json.success) {
        if (json.messages.length !== messages.length) {
          setMessages(json.messages);
        }
      }
    } catch (err) {
      console.error("Failed to poll messages:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    const content = inputText;
    setInputText("");

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/messages/${appointmentId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content })
      });
      const json = await res.json();
      if (json.success) {
        setMessages(prev => [...prev, json.message]);
      } else {
        toast.error(json.message || "Failed to send message");
        setInputText(content);
      }
    } catch (err) {
      toast.error("Network error");
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  // Locker API calls
  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/medical-files/appointment/${appointmentId}`, { headers });
      const json = await res.json();
      if (json.success) {
        setFiles(json.files);
      }
    } catch (err) {
      console.error("Failed to fetch medical files:", err);
      toast.error("Error loading locker files");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFileObj) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFileObj);
    formData.append("fileName", uploadFileName.trim() || uploadFileObj.name);

    try {
      let headers = {};
      if (senderRole === "patient") {
        const token = await getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      } else if (senderRole === "doctor") {
        const docToken = localStorage.getItem(DOCTOR_TOKEN_KEY);
        if (docToken) headers.Authorization = `Bearer ${docToken}`;
      }

      const res = await fetch(`${API_BASE}/api/medical-files/upload/${appointmentId}`, {
        method: "POST",
        headers,
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        toast.success("File uploaded to Medical Locker!");
        setUploadFileObj(null);
        setUploadFileName("");
        fetchFiles();
      } else {
        toast.error(json.message || "Failed to upload file");
      }
    } catch (err) {
      toast.error("Upload failed: Check file format or size (max 5MB)");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file from locker?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/api/medical-files/${fileId}`, {
        method: "DELETE",
        headers
      });
      const json = await res.json();
      if (json.success) {
        toast.success("File deleted successfully");
        fetchFiles();
      } else {
        toast.error(json.message || "Failed to delete file");
      }
    } catch (err) {
      toast.error("Error deleting file");
    }
  };

  if (!isOpen) return null;

  // Resolve current active user ID for delete permissions
  const currentUserId = senderRole === "patient" ? userId : localStorage.getItem("doctorToken_v1") ? jwtDecodeId(localStorage.getItem("doctorToken_v1")) : null;

  function jwtDecodeId(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.id;
    } catch (e) {
      return null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl flex flex-col h-[80vh] sm:h-[600px] overflow-hidden font-sans">
        
        {/* Header & Tabs */}
        <div className="bg-emerald-50 border-b border-emerald-100 p-4 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Telehealth Consultation Room</h3>
                <p className="text-[10px] text-emerald-800 font-medium">Recipient: {recipientName}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer px-2 border-none bg-transparent"
            >
              ✕
            </button>
          </div>

          {/* Dual Tabs */}
          <div className="flex border-b border-slate-200/60 p-0.5 bg-slate-100 rounded-full shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                activeTab === "chat" 
                  ? "bg-white text-emerald-800 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Consult Chat
            </button>
            <button
              onClick={() => setActiveTab("locker")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                activeTab === "locker" 
                  ? "bg-white text-emerald-800 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              <Folder className="w-3.5 h-3.5" /> Medical Locker
            </button>
          </div>
        </div>

        {/* TAB 1: Chat Message Feed */}
        {activeTab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-3">
              {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto text-emerald-600 mb-1" />
                  Initializing consult channel...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs italic">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  Secure consult channel initialized. Type a message below.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.senderRole === senderRole;
                    return (
                      <div key={msg._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1 mb-0.5 text-[9px] text-slate-400 font-bold px-1 uppercase">
                          <span>{msg.senderName}</span>
                          {msg.senderRole === "doctor" && (
                            <span className="bg-blue-100 text-blue-700 text-[8px] px-1 py-0.2 rounded-sm border">MD</span>
                          )}
                        </div>
                        
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-3xs ${
                          isMe 
                            ? "bg-emerald-600 text-white rounded-tr-none" 
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}>
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>

                        <span className="text-[8px] text-slate-400 mt-0.5 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 shrink-0 flex gap-2 items-center">
              <input
                type="text"
                placeholder="Type your telehealth message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending}
                className="flex-grow border border-slate-200 bg-slate-50 focus:bg-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition disabled:opacity-50 shrink-0 cursor-pointer shadow border-none"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* TAB 2: Medical File Locker */}
        {activeTab === "locker" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Upload Area (restricted to patients for diagnostic uploads, or custom doctor uploads) */}
            {senderRole === "patient" && (
              <form onSubmit={handleUploadFile} className="p-4 bg-white border-b border-slate-200/60 shrink-0 space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Upload Diagnostic Report
                </h4>
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input 
                      type="text" 
                      placeholder="Report Name (e.g., Blood Test May 2026)" 
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                      required
                    />
                    <input 
                      type="file" 
                      accept=".pdf,image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setUploadFileObj(file);
                          if (!uploadFileName) setUploadFileName(file.name.split(".")[0]);
                        }
                      }}
                      className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 file:cursor-pointer"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFileObj}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition self-end shrink-0 cursor-pointer border-none"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            )}

            {/* Locker Files List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingFiles ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto text-emerald-600 mb-1" />
                  Loading locker files...
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs italic bg-white rounded-2xl border border-dashed p-6">
                  <Folder className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No reports uploaded yet. {senderRole === "patient" ? "Upload reports above for doctor review." : "Patient has not uploaded any reports."}
                </div>
              ) : (
                <div className="grid gap-2.5">
                  {files.map((file) => {
                    const isUploader = file.uploadedBy === currentUserId;
                    const isPdf = file.fileType?.includes("pdf") || file.fileName?.toLowerCase().endsWith(".pdf");
                    return (
                      <div key={file._id} className="bg-white border border-slate-200 rounded-2xl p-3 flex justify-between items-center gap-4 shadow-3xs">
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{file.fileName}</p>
                          <div className="flex gap-2 text-[9px] text-slate-400 font-bold mt-0.5">
                            <span className="uppercase text-emerald-700">{isPdf ? "PDF Document" : "Image"}</span>
                            <span>•</span>
                            <span>Uploaded by: {file.uploaderRole}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setViewingFile(file);
                              setZoomScale(1);
                              setRotateAngle(0);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition cursor-pointer border-none bg-transparent"
                            title="View & Zoom"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-full transition flex items-center justify-center"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {isUploader && (
                            <button
                              onClick={() => handleDeleteFile(file._id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-full transition cursor-pointer border-none bg-transparent"
                              title="Delete file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Lightbox Viewer Overlay */}
      {viewingFile && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950/95 backdrop-blur-md p-4">
          <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 p-4 text-white rounded-t-2xl">
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">{viewingFile.fileName}</h3>
              <p className="text-[10px] text-slate-400">Uploaded: {new Date(viewingFile.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3">
              {(!viewingFile.fileType?.includes("pdf") && !viewingFile.fileName?.toLowerCase().endsWith(".pdf")) && (
                <div className="flex bg-slate-800 rounded-full border border-slate-700 p-1">
                  <button 
                    onClick={() => setZoomScale(prev => prev + 0.2)}
                    className="p-2 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition border-none bg-transparent cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.2))}
                    className="p-2 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition border-none bg-transparent cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => setRotateAngle(prev => (prev + 90) % 360)}
                    className="p-2 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition border-none bg-transparent cursor-pointer"
                    title="Rotate"
                  >
                    <RotateCw className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => { setZoomScale(1); setRotateAngle(0); }}
                    className="px-3 py-1 text-xs hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition border-none bg-transparent cursor-pointer font-bold"
                  >
                    Reset
                  </button>
                </div>
              )}
              <a 
                href={viewingFile.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                download
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition flex items-center justify-center"
                title="Download Report"
              >
                <Download className="w-4 h-4" />
              </a>
              <button 
                onClick={() => setViewingFile(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition cursor-pointer font-bold text-xs border-none"
              >
                ✕ Close Preview
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-auto p-4 sm:p-8 relative">
            {(viewingFile.fileType?.includes("pdf") || viewingFile.fileName?.toLowerCase().endsWith(".pdf")) ? (
              <iframe 
                src={viewingFile.fileUrl} 
                className="w-full max-w-4xl h-full bg-white rounded-b-2xl shadow-xl border-none"
                title="PDF Report Viewer"
              />
            ) : (
              <div className="max-w-full max-h-full overflow-auto">
                <img 
                  src={viewingFile.fileUrl} 
                  alt="Diagnostic report preview"
                  style={{
                    transform: `scale(${zoomScale}) rotate(${rotateAngle}deg)`,
                    transition: "transform 0.2s ease-out"
                  }}
                  className="max-w-[90vw] max-h-[75vh] object-contain rounded-lg shadow-2xl origin-center"
                />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
