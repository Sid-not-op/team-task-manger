"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  GripVertical,
  Clock,
  AlertTriangle,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";

interface TaskAssignee { id: string; name: string; email: string }
interface Task {
  id: string; title: string; description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null; createdAt: string;
  assignee: TaskAssignee | null;
  project: { id: string; name: string };
}
interface ProjectMember { id: string; name: string; email: string; role: string }
interface Project {
  id: string; name: string; description: string | null; createdAt: string;
  createdBy: { id: string; name: string; email: string };
  members: ProjectMember[]; tasks: Task[];
}
interface UserItem { id: string; name: string; email: string; role: string }

const columns = [
  { status: "TODO" as const, title: "To Do", color: "text-slate-400", dotColor: "bg-slate-400", bgColor: "bg-slate-500/5", borderColor: "border-slate-500/20" },
  { status: "IN_PROGRESS" as const, title: "In Progress", color: "text-blue-400", dotColor: "bg-blue-400", bgColor: "bg-blue-500/5", borderColor: "border-blue-500/20" },
  { status: "DONE" as const, title: "Done", color: "text-emerald-400", dotColor: "bg-emerald-400", bgColor: "bg-emerald-500/5", borderColor: "border-emerald-500/20" },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProjectTaskBoard() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const isAdmin = session?.user.role === "ADMIN";

  const [project, setProject] = useState<Project | null>(null);
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // New task form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");

  // Member add selection
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) { setProject((await res.json()).project); }
      else if (res.status === 404 || res.status === 403) { router.push("/dashboard/projects"); }
    } catch (e) { console.error("Failed to fetch project:", e); }
    finally { setLoading(false); }
  }, [projectId, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setAllUsers((await res.json()).users);
    } catch (e) { console.error("Failed to fetch users:", e); }
  }, []);

  useEffect(() => { fetchProject(); if (isAdmin) fetchUsers(); }, [fetchProject, fetchUsers, isAdmin]);

  // ── Handlers ──────────────────────────────────────
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDesc || undefined, status: newStatus, dueDate: newDueDate || undefined, assigneeId: newAssigneeId || undefined }),
      });
      if (res.ok) { setCreateOpen(false); setNewTitle(""); setNewDesc(""); setNewStatus("TODO"); setNewDueDate(""); setNewAssigneeId(""); fetchProject(); }
    } catch (e) { console.error("Failed to create task:", e); }
    finally { setCreating(false); }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (res.ok) fetchProject();
    } catch (e) { console.error(e); }
    finally { setUpdatingTaskId(null); }
  };

  const handleAssigneeChange = async (taskId: string, assigneeId: string | null) => {
    setUpdatingTaskId(taskId);
    try {
      const body = assigneeId === "unassigned" ? { assigneeId: null } : { assigneeId };
      const res = await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) fetchProject();
    } catch (e) { console.error(e); }
    finally { setUpdatingTaskId(null); }
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.length === 0) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: selectedNewMembers }),
      });
      if (res.ok) { setSelectedNewMembers([]); fetchProject(); }
    } catch (e) { console.error(e); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) fetchProject();
    } catch (e) { console.error(e); }
    finally { setRemovingMemberId(null); }
  };

  const toggleNewMember = (id: string) => {
    setSelectedNewMembers((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  // ── Render ────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;
  if (!project) return null;

  const tasksByStatus = {
    TODO: project.tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: project.tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: project.tasks.filter((t) => t.status === "DONE"),
  };

  const nonMembers = allUsers.filter((u) => !project.members.some((m) => m.id === u.id));

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/projects" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
            <span className="text-sm text-muted-foreground">Projects /</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight truncate">{project.name}</h1>
          {project.description && <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{project.description}</p>}

          {/* Member avatars + Manage button */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex -space-x-2">
              {project.members.slice(0, 5).map((m) => (
                <Avatar key={m.id} className="w-7 h-7 border-2 border-background" title={m.name}>
                  <AvatarFallback className="text-[10px] bg-accent">{getInitials(m.name)}</AvatarFallback>
                </Avatar>
              ))}
              {project.members.length > 5 && (
                <Avatar className="w-7 h-7 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-violet-500/20 text-violet-400">+{project.members.length - 5}</AvatarFallback>
                </Avatar>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {project.members.length} member{project.members.length !== 1 ? "s" : ""} • {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
            </span>

            {/* Manage Members Button (Admin) */}
            {isAdmin && (
              <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
                <DialogTrigger className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/40 bg-accent/30 hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <Users className="w-3.5 h-3.5" /> Manage Members
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Manage Project Members</DialogTitle>
                    <DialogDescription>Add or remove members from &quot;{project.name}&quot;</DialogDescription>
                  </DialogHeader>

                  {/* Current members list */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Current Members ({project.members.length})</Label>
                    <div className="max-h-48 overflow-auto rounded-lg border border-border/40 bg-background/50 divide-y divide-border/30">
                      {project.members.map((member) => {
                        const isCreator = member.id === project.createdBy.id;
                        const isSelf = member.id === session?.user.id;
                        return (
                          <div key={member.id} className="flex items-center gap-3 px-3 py-2.5">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="text-[10px] bg-accent">{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{member.name}{isSelf ? " (you)" : ""}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            </div>
                            <Badge variant="secondary" className={`text-[10px] ${member.role === "ADMIN" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
                              {member.role}
                            </Badge>
                            {!isCreator && !isSelf && (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={removingMemberId === member.id}
                                className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 cursor-pointer"
                                title="Remove member"
                              >
                                {removingMemberId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add new members */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Add Members</Label>
                    {nonMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">All users are already members of this project.</p>
                    ) : (
                      <>
                        <div className="max-h-40 overflow-auto rounded-lg border border-border/40 bg-background/50 divide-y divide-border/30">
                          {nonMembers.map((user) => (
                            <label key={user.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer">
                              <input type="checkbox" checked={selectedNewMembers.includes(user.id)} onChange={() => toggleNewMember(user.id)} className="rounded border-border/60 w-4 h-4" />
                              <Avatar className="w-7 h-7"><AvatarFallback className="text-[10px] bg-accent">{getInitials(user.name)}</AvatarFallback></Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                              <Badge variant="secondary" className={`text-[10px] ${user.role === "ADMIN" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>{user.role}</Badge>
                            </label>
                          ))}
                        </div>
                        <Button
                          onClick={handleAddMembers}
                          disabled={selectedNewMembers.length === 0 || addingMember}
                          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                        >
                          {addingMember ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                          Add {selectedNewMembers.length > 0 ? `${selectedNewMembers.length} Member${selectedNewMembers.length > 1 ? "s" : ""}` : "Members"}
                        </Button>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Add Task button (Admin) */}
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 shrink-0 cursor-pointer transition-colors">
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a task to &quot;{project.name}&quot;</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input id="task-title" placeholder="e.g., Design login page" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-desc">Description (optional)</Label>
                  <Textarea id="task-desc" placeholder="Add more detail..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="bg-background/50 resize-none" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-status">Status</Label>
                    <Select value={newStatus} onValueChange={(v: string | null) => { if (v) setNewStatus(v as "TODO" | "IN_PROGRESS" | "DONE"); }}>
                      <SelectTrigger id="task-status" className="bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-due">Due Date</Label>
                    <Input id="task-due" type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="bg-background/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assign To</Label>
                  <Select value={newAssigneeId} onValueChange={(v: string | null) => setNewAssigneeId(v ?? "")}>
                    <SelectTrigger id="task-assignee" className="bg-background/50"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {project.members.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating || !newTitle.trim()} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ── Kanban Board ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {columns.map((column) => {
          const tasks = tasksByStatus[column.status];
          return (
            <div key={column.status} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                  <h2 className={`text-sm font-semibold ${column.color}`}>{column.title}</h2>
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] bg-accent/50">{tasks.length}</Badge>
                </div>
              </div>

              <div className={`rounded-xl ${column.bgColor} border ${column.borderColor} p-3 min-h-[200px] space-y-3`}>
                {tasks.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground"><p className="text-xs">No tasks</p></div>
                ) : (
                  tasks.map((task) => {
                    const isOverdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();
                    const canUpdateStatus = isAdmin || task.assignee?.id === session?.user.id;
                    const isUpdating = updatingTaskId === task.id;

                    return (
                      <Card key={task.id} className="border-border/30 bg-card/90 backdrop-blur-sm hover:border-border/50 transition-all duration-200 group">
                        <CardContent className="p-3.5 space-y-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-snug">{task.title}</p>
                              {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                            </div>
                          </div>

                          {/* Meta: due date + assignee dropdown */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {task.dueDate && (
                                <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                                  {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                  <span>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                </div>
                              )}
                            </div>

                            {/* Assignee: clickable dropdown for admin, static avatar for members */}
                            {isAdmin ? (
                              <Select
                                value={task.assignee?.id ?? "unassigned"}
                                onValueChange={(v: string | null) => { if (v) handleAssigneeChange(task.id, v); }}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="h-7 w-auto min-w-0 gap-1.5 px-2 text-[11px] bg-background/30 border-border/30">
                                  {task.assignee ? (
                                    <div className="flex items-center gap-1.5">
                                      <Avatar className="w-4 h-4"><AvatarFallback className="text-[7px] bg-accent">{getInitials(task.assignee.name)}</AvatarFallback></Avatar>
                                      <span className="truncate max-w-[60px]">{task.assignee.name.split(" ")[0]}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-muted-foreground"><User className="w-3 h-3" /> <span>Assign</span></div>
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">
                                    <div className="flex items-center gap-2"><User className="w-3 h-3 text-muted-foreground" /> Unassigned</div>
                                  </SelectItem>
                                  {project.members.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-4 h-4"><AvatarFallback className="text-[7px] bg-accent">{getInitials(m.name)}</AvatarFallback></Avatar>
                                        {m.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              task.assignee ? (
                                <Avatar className="w-6 h-6" title={task.assignee.name}>
                                  <AvatarFallback className="text-[9px] bg-accent">{getInitials(task.assignee.name)}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-6 h-6 rounded-full border border-dashed border-border/50 flex items-center justify-center">
                                  <User className="w-3 h-3 text-muted-foreground/50" />
                                </div>
                              )
                            )}
                          </div>

                          {/* Status Changer */}
                          {canUpdateStatus && (
                            <Select value={task.status} onValueChange={(v: string | null) => { if (v) handleStatusChange(task.id, v); }} disabled={isUpdating}>
                              <SelectTrigger className="h-7 text-[11px] bg-background/30 border-border/30">
                                {isUpdating ? (
                                  <div className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /><span>Updating...</span></div>
                                ) : (<SelectValue />)}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TODO"><div className="flex items-center gap-2"><Clock className="w-3 h-3 text-slate-400" /> To Do</div></SelectItem>
                                <SelectItem value="IN_PROGRESS"><div className="flex items-center gap-2"><Clock className="w-3 h-3 text-blue-400" /> In Progress</div></SelectItem>
                                <SelectItem value="DONE"><div className="flex items-center gap-2"><Clock className="w-3 h-3 text-emerald-400" /> Done</div></SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
