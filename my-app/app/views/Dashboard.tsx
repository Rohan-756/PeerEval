'use client';
import React, { useEffect, useState } from 'react';

// --- Types ---
interface User {
  id: string;
  email: string;
  role: 'student' | 'instructor';
}

interface DashboardProps {
  user?: User; // optional, loaded from props or localStorage
}

interface Project {
  id: string;
  title: string;
  description?: string;
  invites?: Invite[];
}

interface Invite {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  studentEmail?: string;
  project?: Project; // when fetched for student
}

// Union type for instructor or student
type DashboardItem = Project | Invite;

export default function Dashboard({ user: initialUser }: DashboardProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [projects, setProjects] = useState<DashboardItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentEmails, setStudentEmails] = useState<Record<string, string>>({});

  // ✅ Load user from localStorage if not provided
  useEffect(() => {
    if (!initialUser) {
      try {
        const stored = localStorage.getItem('peerEvalUser');
        if (stored) {
          const parsed: User = JSON.parse(stored);
          if (parsed.id && parsed.email && parsed.role) {
            setUser(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to parse user from localStorage', err);
      }
    }
  }, [initialUser]);

  // --- Fetch projects ---
  const fetchProjects = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/projects/list?userId=${user.id}`);
      const data = await res.json();

      if (res.ok) {
        setProjects(data.projects || []);
      } else {
        console.error('Error fetching projects:', data?.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.id) fetchProjects();
  }, [user]);

  // --- Create a project (instructor only) ---
  const createProject = async () => {
    if (!title.trim()) return alert('Project title is required');
    if (!user?.id) return;
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, instructorId: user.id }),
      });

      const data = await res.json();
      if (res.ok) {
        setTitle('');
        setDescription('');
        fetchProjects();
      } else {
        alert(data?.error || 'Failed to create project');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Send invite (instructor only) ---
  const sendInvite = async (projectId: string) => {
    const studentEmail = studentEmails[projectId]?.trim();
    if (!studentEmail) return alert('Student email is required');
    if (!user?.id) return;

    try {
      const res = await fetch('/api/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, studentEmail, instructorId: user.id }),
      });

      const data = await res.json();
      if (res.ok) {
        setStudentEmails(prev => ({ ...prev, [projectId]: '' }));
        fetchProjects();
      } else {
        alert(data?.error || 'Failed to send invite');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Respond to invite (student only) ---
  const respondInvite = async (inviteId: string, status: 'accepted' | 'rejected') => {
    if (!user?.id) return;

    try {
      const res = await fetch('/api/invites/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, status, studentId: user.id }),
      });

      const data = await res.json();
      if (res.ok) fetchProjects();
      else alert(data?.error || 'Failed to respond to invite');
    } catch (err) {
      console.error(err);
    }
  };

  // --- Render fallback if user missing ---
  if (!user) {
    return (
      <div className="p-6 text-center text-red-600 font-bold">
        Error: User data not available.
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Welcome, {user.email} ({user.role})
      </h1>

      {/* Instructor View */}
      {user.role === 'instructor' && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Create Project</h2>
          <input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="p-2 border rounded mr-2"
          />
          <input
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="p-2 border rounded mr-2"
          />
          <button onClick={createProject} className="px-4 py-2 bg-indigo-600 text-white rounded">
            Create
          </button>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">
        {user.role === 'instructor' ? 'Your Projects' : 'Your Invites'}
      </h2>
      {projects.length === 0 && <p>No projects found.</p>}

      {projects.map((p) => {
        const project = 'project' in p && p.project ? p.project : (p as Project);
        const invites =
          'project' in p && p.project ? [{ id: p.id, status: p.status }] : (p as Project).invites;

        return (
          <div key={`project-${project.id}`} className="mb-4 p-4 border rounded">
            <h3 className="font-bold">{project.title}</h3>
            <p>{project.description}</p>

            {/* Instructor Actions */}
            {user.role === 'instructor' && (
              <div className="mt-2 flex items-center space-x-2">
                <input
                  placeholder="Student Email"
                  value={studentEmails[project.id] || ''}
                  onChange={e =>
                    setStudentEmails(prev => ({ ...prev, [project.id]: e.target.value }))
                  }
                  className="p-2 border rounded"
                />
                <button
                  onClick={() => sendInvite(project.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Send Invite
                </button>
              </div>
            )}

            {/* Student Actions */}
            {user.role === 'student' &&
              invites?.map(invite =>
                invite.status === 'pending' ? (
                  <div key={`invite-${invite.id}`} className="mt-2 space-x-2">
                    <button
                      onClick={() => respondInvite(invite.id, 'accepted')}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondInvite(invite.id, 'rejected')}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div key={`invite-${invite.id}`} className="mt-2">
                    <span
                      className={`px-3 py-1 rounded text-white ${
                        invite.status === 'accepted' ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {invite.status.toUpperCase()}
                    </span>
                  </div>
                )
              )}
          </div>
        );
      })}
    </div>
  );
}
