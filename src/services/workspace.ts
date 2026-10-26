import { getAccessToken } from './auth';

export interface WorkspaceEmail {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
}

export interface WorkspaceEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export interface WorkspaceContact {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
}

// Fallback prototype data when token is not yet connected or in offline demo mode
const DEMO_EMAILS: WorkspaceEmail[] = [
  {
    id: 'msg-001',
    subject: 'Project Mark LXXXV: Arc Reactor Output Variance',
    from: 'Dr. Helen Cho <cho@starkindustries.com>',
    date: '10:42 AM',
    snippet: 'Preliminary telemetry confirms 300% efficiency gains in palladium-substitute synthesis...',
  },
  {
    id: 'msg-002',
    subject: 'Avengers Compound Security Protocol Review',
    from: 'Col. James Rhodes <rhodey@usaf.mil>',
    date: 'Yesterday',
    snippet: 'EDITH orbital tracking parameters have been updated for regional sector 4...',
  },
  {
    id: 'msg-003',
    subject: 'Board Meeting Agenda: Clean Energy Grid Q4',
    from: 'Pepper Potts <pep@starkindustries.com>',
    date: 'Oct 23',
    snippet: 'Please verify the smart grid distribution metrics before the 14:00 briefing...',
  },
];

const DEMO_FILES: WorkspaceFile[] = [
  { id: 'file-1', name: 'Nanotech_Armor_Schematics_v4.2.dwg', mimeType: 'application/octet-stream', modifiedTime: '2026-10-24 03:15', size: '48.2 MB' },
  { id: 'file-2', name: 'Clean_Energy_Output_Q4.sheet', mimeType: 'application/vnd.google-apps.spreadsheet', modifiedTime: '2026-10-23 18:30', size: '1.4 MB' },
  { id: 'file-3', name: 'EDITH_Orbital_Tracking_Protocol.doc', mimeType: 'application/vnd.google-apps.document', modifiedTime: '2026-10-22 09:12', size: '820 KB' },
  { id: 'file-4', name: 'Stark_Compound_IoT_Topology.slides', mimeType: 'application/vnd.google-apps.presentation', modifiedTime: '2026-10-20 14:40', size: '12.5 MB' },
];

const DEMO_EVENTS: WorkspaceEvent[] = [
  { id: 'evt-1', summary: 'Orbital Reconnaissance Sync (EDITH)', start: '11:00 AM', end: '11:30 AM', location: 'Server Lab A' },
  { id: 'evt-2', summary: 'Arc Reactor Load Balancing Test', start: '02:00 PM', end: '03:15 PM', location: 'Compound Power Substation' },
  { id: 'evt-3', summary: 'Global Smart Home Mesh Calibration', start: '04:30 PM', end: '05:00 PM', location: 'Stark Tower Core' },
];

const DEMO_TASKS: WorkspaceTask[] = [
  { id: 'tsk-1', title: 'Calibrate thermite repulsor focus coils', status: 'needsAction', due: 'Today' },
  { id: 'tsk-2', title: 'Compile telemetry briefing for Avengers network', status: 'needsAction', due: 'Today' },
  { id: 'tsk-3', title: 'Sanitize encrypted security logs in memory', status: 'completed' },
];

const DEMO_CONTACTS: WorkspaceContact[] = [
  { id: 'cnt-1', displayName: 'Pepper Potts', email: 'pep@starkindustries.com', phone: '+1 (212) 555-0199' },
  { id: 'cnt-2', displayName: 'Col. James Rhodes', email: 'rhodey@usaf.mil', phone: '+1 (202) 555-0144' },
  { id: 'cnt-3', displayName: 'Happy Hogan', email: 'happy@starkindustries.com', phone: '+1 (212) 555-0182' },
  { id: 'cnt-4', displayName: 'Peter Parker', email: 'peter@midtowntech.edu', phone: '+1 (718) 555-0129' },
];

export class WorkspaceService {
  // GMAIL: Fetch list of emails
  public static async getEmails(): Promise<WorkspaceEmail[]> {
    const token = await getAccessToken();
    if (!token) return DEMO_EMAILS;

    try {
      const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!listRes.ok) return DEMO_EMAILS;
      const listData = await listRes.json();
      if (!listData.messages) return DEMO_EMAILS;

      const emails: WorkspaceEmail[] = [];
      for (const msg of listData.messages.slice(0, 5)) {
        const itemRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (itemRes.ok) {
          const item = await itemRes.json();
          const headers = item.payload?.headers || [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
          const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
          const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
          emails.push({
            id: item.id,
            subject,
            from,
            date: date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            snippet: item.snippet || '',
          });
        }
      }
      return emails.length > 0 ? emails : DEMO_EMAILS;
    } catch {
      return DEMO_EMAILS;
    }
  }

  // GMAIL: Send email (destructively mutates mailbox / sends dispatch)
  public static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) {
      console.log(`[Workspace Simulated] Email dispatched to ${to}: ${subject}`);
      return true;
    }

    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      body,
    ];
    const rawMessage = btoa(unescape(encodeURIComponent(messageParts.join('\r\n'))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
    });
    return res.ok;
  }

  // DRIVE: List files
  public static async getDriveFiles(): Promise<WorkspaceFile[]> {
    const token = await getAccessToken();
    if (!token) return DEMO_FILES;

    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,modifiedTime,size)', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return DEMO_FILES;
      const data = await res.json();
      return data.files || DEMO_FILES;
    } catch {
      return DEMO_FILES;
    }
  }

  // CALENDAR: List events
  public static async getCalendarEvents(): Promise<WorkspaceEvent[]> {
    const token = await getAccessToken();
    if (!token) return DEMO_EVENTS;

    try {
      const timeMin = new Date().toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=6&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return DEMO_EVENTS;
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || 'Scheduled Protocol',
        start: item.start?.dateTime ? new Date(item.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day',
        end: item.end?.dateTime ? new Date(item.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        location: item.location,
      }));
    } catch {
      return DEMO_EVENTS;
    }
  }

  // CALENDAR: Add Event
  public static async createCalendarEvent(summary: string, description: string, startIso: string, endIso: string): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) return true;

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startIso },
        end: { dateTime: endIso },
      }),
    });
    return res.ok;
  }

  // TASKS: Get tasks
  public static async getTasks(): Promise<WorkspaceTask[]> {
    const token = await getAccessToken();
    if (!token) return DEMO_TASKS;

    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=8', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return DEMO_TASKS;
      const data = await res.json();
      return (data.items || []).map((t: any) => ({
        id: t.id,
        title: t.title || 'Untitled Action Item',
        status: t.status === 'completed' ? 'completed' : 'needsAction',
        due: t.due ? new Date(t.due).toLocaleDateString() : undefined,
      }));
    } catch {
      return DEMO_TASKS;
    }
  }

  // CONTACTS: Get contacts
  public static async getContacts(): Promise<WorkspaceContact[]> {
    const token = await getAccessToken();
    if (!token) return DEMO_CONTACTS;

    try {
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=10', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return DEMO_CONTACTS;
      const data = await res.json();
      return (data.connections || []).map((p: any) => ({
        id: p.resourceName || Math.random().toString(),
        displayName: p.names?.[0]?.displayName || 'Unknown Contact',
        email: p.emailAddresses?.[0]?.value,
        phone: p.phoneNumbers?.[0]?.value,
      }));
    } catch {
      return DEMO_CONTACTS;
    }
  }

  // DOCS: Create Google Doc
  public static async createGoogleDoc(title: string): Promise<{ documentId: string; title: string } | null> {
    const token = await getAccessToken();
    if (!token) return { documentId: 'mock-doc-id', title };

    try {
      const res = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // MEET: Create meeting space
  public static async createMeetSpace(): Promise<{ meetingUri: string } | null> {
    const token = await getAccessToken();
    if (!token) return { meetingUri: 'https://meet.google.com/new' };

    try {
      const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) return { meetingUri: 'https://meet.google.com/new' };
      const data = await res.json();
      return { meetingUri: data.meetingUri || data.meetingCode ? `https://meet.google.com/${data.meetingCode}` : 'https://meet.google.com/new' };
    } catch {
      return { meetingUri: 'https://meet.google.com/new' };
    }
  }

  // GOOGLE PICKER: Open Google Picker widget for selecting Drive files
  public static openGooglePicker(
    accessToken: string,
    onPicked: (file: { id: string; name: string; mimeType: string; url?: string }) => void,
    onError?: (err: any) => void
  ) {
    if (typeof window === 'undefined') return;

    const gapi = (window as any).gapi;
    const google = (window as any).google;

    const buildAndShowPicker = () => {
      try {
        const pickerOrigin =
          window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
            ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
            : window.location.origin;

        const pickerCallback = (data: any) => {
          if (data && data.action === google.picker.Action.PICKED) {
            const doc = data.docs[0];
            onPicked({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              url: doc.url,
            });
          }
        };

        const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
        view.setIncludeFolders(true);

        const picker = new google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(accessToken)
          .setCallback(pickerCallback)
          .setOrigin(pickerOrigin)
          .setTitle('Noble Drive Asset Reconnaissance (Google Picker)')
          .build();

        picker.setVisible(true);
      } catch (err) {
        console.error('Picker initialization error:', err);
        if (onError) onError(err);
      }
    };

    if (gapi && gapi.load) {
      gapi.load('picker', { callback: buildAndShowPicker });
    } else {
      console.warn('GAPI client not loaded yet');
      if (onError) onError(new Error('GAPI client script not loaded'));
    }
  }
}
