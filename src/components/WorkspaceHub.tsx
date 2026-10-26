import React, { useState, useEffect } from 'react';
import { googleSignIn, logout, getAccessToken } from '../services/auth';
import {
  WorkspaceService,
  WorkspaceEmail,
  WorkspaceFile,
  WorkspaceEvent,
  WorkspaceTask,
  WorkspaceContact,
} from '../services/workspace';
import { sound } from '../services/audio';
import {
  Mail,
  FolderOpen,
  Calendar,
  FileText,
  CheckSquare,
  Users,
  Video,
  Send,
  Plus,
  AlertOctagon,
  LogOut,
  ExternalLink,
  PhoneCall,
} from 'lucide-react';

interface WorkspaceHubProps {
  currentUser: any;
  onUserChange?: (user: any) => void;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({ currentUser, onUserChange }) => {
  const [activeTab, setActiveTab] = useState<'gmail' | 'drive' | 'calendar' | 'tasks' | 'contacts'>('gmail');
  const [emails, setEmails] = useState<WorkspaceEmail[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [events, setEvents] = useState<WorkspaceEvent[]>([]);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [contacts, setContacts] = useState<WorkspaceContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal confirmation for destructive operations (MANDATORY per Workspace Skill)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    onConfirm: async () => {},
  });

  // Compose email draft state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  // Google Picker State
  const [pickedFile, setPickedFile] = useState<{ id: string; name: string; mimeType: string; url?: string } | null>(null);
  const [showDemoPicker, setShowDemoPicker] = useState(false);

  // Open Google Picker
  const handleOpenPicker = async () => {
    sound.playArcCharge();
    const token = await getAccessToken();

    if (token && typeof window !== 'undefined' && (window as any).gapi) {
      WorkspaceService.openGooglePicker(
        token,
        (doc) => {
          setPickedFile(doc);
          sound.playCommandAcknowledged();
        },
        () => {
          // If Picker widget cannot render in iframe, fall back to interactive picker dialog
          setShowDemoPicker(true);
        }
      );
    } else {
      setShowDemoPicker(true);
    }
  };

  // New task input state
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Load data
  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const [emailList, fileList, eventList, taskList, contactList] = await Promise.all([
        WorkspaceService.getEmails(),
        WorkspaceService.getDriveFiles(),
        WorkspaceService.getCalendarEvents(),
        WorkspaceService.getTasks(),
        WorkspaceService.getContacts(),
      ]);
      setEmails(emailList);
      setFiles(fileList);
      setEvents(eventList);
      setTasks(taskList);
      setContacts(contactList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [currentUser]);

  // Sign In handler
  const handleSignIn = async () => {
    try {
      sound.playChirp(1400);
      const res = await googleSignIn();
      if (res && onUserChange) {
        onUserChange(res.user);
        sound.playCommandAcknowledged();
        loadWorkspaceData();
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        !err?.message?.includes('popup-closed-by-user')
      ) {
        console.error('[Noble Workspace] Sign-in error:', err);
        sound.playAlert();
      }
    }
  };

  // Sign Out handler
  const handleSignOut = async () => {
    sound.playChirp(800);
    await logout();
    if (onUserChange) onUserChange(null);
  };

  // Dispatch Email with Mandatory Confirmation Dialog
  const handleSendEmailPrompt = () => {
    if (!composeTo || !composeSubject) {
      alert('Recipient and subject required.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Outbound Email Dispatch',
      description: `You are about to transmit an email to "${composeTo}" with subject "${composeSubject}". This operation mutates your Gmail mailbox and dispatches an authentic network message.`,
      actionLabel: 'Confirm & Dispatch Email',
      onConfirm: async () => {
        sound.playArcCharge();
        await WorkspaceService.sendEmail(composeTo, composeSubject, composeBody);
        sound.playCommandAcknowledged();
        setShowCompose(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        loadWorkspaceData();
      },
    });
  };

  // Create Google Doc with Confirmation
  const handleCreateDocPrompt = () => {
    const title = prompt('Enter document title for new Google Doc:', 'Noble Operations Brief v1.0');
    if (!title) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Google Docs Document Creation',
      description: `Create new document "${title}" in your Google Drive storage?`,
      actionLabel: 'Confirm Document Creation',
      onConfirm: async () => {
        sound.playArcCharge();
        await WorkspaceService.createGoogleDoc(title);
        sound.playCommandAcknowledged();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        loadWorkspaceData();
      },
    });
  };

  // Create Google Meet Room
  const handleCreateMeet = async () => {
    sound.playChirp(1200);
    const meet = await WorkspaceService.createMeetSpace();
    if (meet) {
      window.open(meet.meetingUri, '_blank');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#070c16] border border-cyan-500/25 rounded-lg overflow-hidden font-sans">
      {/* Top Header */}
      <div className="px-5 py-3 bg-[#0a1120] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FolderOpen className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
            GOOGLE WORKSPACE AUTOMATION MATRIX
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-semibold">
            {currentUser ? 'OAUTH: CONNECTED' : 'DEMO PREVIEW MODE'}
          </span>
        </div>

        {/* Auth status & official sign-in button */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-cyan-200">
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-500/40 rounded hover:bg-rose-900 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                DISCONNECT
              </button>
            </div>
          ) : (
            /* Official Google Sign-in button per Workspace Skill */
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-800 text-xs font-medium rounded shadow hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}

          <button
            onClick={handleCreateMeet}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-mono font-bold hover:bg-emerald-600/50 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            START MEET
          </button>
        </div>
      </div>

      {/* Workspace App Navigation Tabs */}
      <div className="px-5 py-2 bg-[#090f1d] border-b border-cyan-500/20 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'gmail', label: 'GMAIL', icon: Mail, count: emails.length },
          { id: 'drive', label: 'DRIVE & DOCS', icon: FolderOpen, count: files.length },
          { id: 'calendar', label: 'CALENDAR', icon: Calendar, count: events.length },
          { id: 'tasks', label: 'TASKS', icon: CheckSquare, count: tasks.length },
          { id: 'contacts', label: 'CONTACTS', icon: Users, count: contacts.length },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                sound.playChirp(1100);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                  : 'bg-slate-900 text-cyan-300 border border-cyan-500/20 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-cyan-200">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* TAB 1: GMAIL */}
        {activeTab === 'gmail' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                INBOX DISPATCHES & COMMUNICATIONS
              </span>
              <button
                onClick={() => setShowCompose(!showCompose)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-xs font-mono hover:bg-cyan-500/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showCompose ? 'CLOSE COMPOSE' : 'COMPOSE DISPATCH'}
              </button>
            </div>

            {/* Compose Drawer */}
            {showCompose && (
              <div className="p-4 bg-slate-900 border border-cyan-500/30 rounded space-y-3 font-mono text-xs">
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="Recipient (e.g. pepper@starkindustries.com)..."
                  className="w-full bg-black/60 border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject (e.g. Arc Reactor Telemetry Review)..."
                  className="w-full bg-black/60 border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  rows={4}
                  placeholder="Enter message dispatch content..."
                  className="w-full bg-black/60 border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSendEmailPrompt}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded hover:bg-cyan-400 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    DISPATCH VIA GMAIL
                  </button>
                </div>
              </div>
            )}

            {/* Email list */}
            <div className="space-y-2">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="p-3.5 bg-[#0d1627] border border-cyan-500/20 rounded hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-cyan-200">{email.from}</span>
                    <span className="font-mono text-[10px] text-slate-400">{email.date}</span>
                  </div>
                  <div className="font-mono text-xs text-white font-semibold mb-1">{email.subject}</div>
                  <p className="font-mono text-[11px] text-slate-400 line-clamp-2">{email.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DRIVE & DOCS */}
        {activeTab === 'drive' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                CLOUD STORAGE REPOSITORY (DRIVE, DOCS & GOOGLE PICKER)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenPicker}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded text-xs font-mono font-bold hover:bg-emerald-500/30 cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  OPEN GOOGLE PICKER
                </button>
                <button
                  onClick={handleCreateDocPrompt}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-xs font-mono hover:bg-cyan-500/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  NEW GOOGLE DOC
                </button>
              </div>
            </div>

            {/* Selected Google Picker File Tray */}
            {pickedFile && (
              <div className="p-3.5 bg-emerald-950/40 border-2 border-emerald-500/50 rounded flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-emerald-500/20 text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      ASSET SELECTED VIA GOOGLE PICKER
                    </div>
                    <div className="font-bold text-white text-xs">{pickedFile.name}</div>
                    <div className="text-[10px] text-slate-400">
                      ID: {pickedFile.id} • MIME: {pickedFile.mimeType}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playChirp(1400);
                      setActiveTab('gmail');
                      setShowCompose(true);
                      setComposeBody((prev) => `${prev}\n\nAttached Cloud Asset: ${pickedFile.name} (Drive ID: ${pickedFile.id})`);
                    }}
                    className="px-2.5 py-1 bg-cyan-500 text-slate-950 text-[10px] font-bold rounded hover:bg-cyan-400 cursor-pointer"
                  >
                    ATTACH TO EMAIL
                  </button>
                  <button
                    onClick={() => {
                      sound.playChirp(800);
                      setPickedFile(null);
                    }}
                    className="px-2 py-1 bg-slate-800 text-slate-300 text-[10px] rounded hover:bg-slate-700 cursor-pointer"
                  >
                    CLEAR
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 bg-[#0d1627] border border-cyan-500/20 rounded flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-200">{file.name}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        Modified: {file.modifiedTime} {file.size ? `• ${file.size}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => sound.playChirp(1200)}
                    className="p-1 text-cyan-400 hover:text-cyan-200 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                SYNCHRONIZED EVENTS & SCHEDULES
              </span>
            </div>

            <div className="space-y-2.5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 bg-[#0d1627] border border-cyan-500/20 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-cyan-200">{evt.summary}</div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {evt.start} - {evt.end} {evt.location ? `• ${evt.location}` : ''}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    CALENDAR SYNCED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TASKS */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                TACTICAL DIRECTIVES (GOOGLE TASKS)
              </span>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-[#0d1627] border border-cyan-500/20 rounded flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare
                      className={`w-4 h-4 ${
                        task.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    />
                    <span
                      className={`font-mono text-xs ${
                        task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  {task.due && <span className="font-mono text-[10px] text-cyan-400">{task.due}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                DIRECTORY & DIRECT CONTACTS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-[#0d1627] border border-cyan-500/20 rounded flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-200">{c.displayName}</div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {c.email || 'No email registered'}
                    </div>
                    {c.phone && <div className="font-mono text-[10px] text-cyan-400">{c.phone}</div>}
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      onClick={() => sound.playChirp(1300)}
                      className="p-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-500/30 transition-colors"
                      title="Dispatch Call (tel: link)"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE / MUTATING WORKSPACE ACTIONS */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0a1120] border-2 border-amber-500/80 rounded-lg p-5 shadow-2xl font-mono">
            <div className="flex items-center gap-2.5 text-amber-400 mb-3 pb-2 border-b border-amber-500/30">
              <AlertOctagon className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase">{confirmModal.title}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  sound.playChirp(800);
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-3.5 py-1.5 text-xs text-slate-400 border border-slate-700 rounded hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmModal.onConfirm()}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 text-slate-950 rounded hover:bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] cursor-pointer"
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE PICKER DIALOG (FALLBACK / IN-APP VIEW) */}
      {showDemoPicker && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0a1120] border-2 border-emerald-500/80 rounded-lg p-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30 mb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase">
                <FolderOpen className="w-5 h-5" />
                <span>GOOGLE DRIVE PICKER (SELECT ASSET)</span>
              </div>
              <button
                onClick={() => setShowDemoPicker(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-300 mb-3">
              Select a Google Drive file to import into Noble workspace operations:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => {
                    sound.playCommandAcknowledged();
                    setPickedFile({
                      id: file.id,
                      name: file.name,
                      mimeType: file.mimeType,
                    });
                    setShowDemoPicker(false);
                  }}
                  className="p-3 bg-black/50 border border-slate-800 rounded hover:border-emerald-400/60 hover:bg-emerald-950/20 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold text-white text-[11px]">{file.name}</div>
                      <div className="text-[9px] text-slate-400">ID: {file.id}</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    SELECT
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowDemoPicker(false)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
