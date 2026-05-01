"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FolderKanban,
  Plus,
  Users,
  ListTodo,
  Loader2,
  ArrowRight,
  Calendar,
} from "lucide-react";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  members: ProjectMember[];
  _count: { tasks: number };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    if (isAdmin) fetchUsers();
  }, [fetchProjects, fetchUsers, isAdmin]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDesc || undefined,
          memberIds: selectedMembers,
        }),
      });

      if (res.ok) {
        setCreateOpen(false);
        setNewName("");
        setNewDesc("");
        setSelectedMembers([]);
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreating(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Manage all team projects"
              : "View projects you belong to"}
          </p>
        </div>

        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 cursor-pointer transition-colors"
            >
                <Plus className="w-4 h-4 mr-2" />
                New Project
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Set up a new project and invite team members
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Website Redesign"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-desc">Description (optional)</Label>
                  <Textarea
                    id="project-desc"
                    placeholder="Briefly describe the project goals..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="bg-background/50 resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Add Members</Label>
                  <div className="max-h-40 overflow-auto rounded-lg border border-border/40 bg-background/50 divide-y divide-border/30">
                    {users
                      .filter((u) => u.id !== session?.user.id)
                      .map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(user.id)}
                            onChange={() => toggleMember(user.id)}
                            className="rounded border-border/60 text-violet-600 focus:ring-violet-500 w-4 h-4"
                          />
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="text-[10px] bg-accent">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              user.role === "ADMIN"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-blue-500/15 text-blue-400"
                            }`}
                          >
                            {user.role}
                          </Badge>
                        </label>
                      ))}
                    {users.filter((u) => u.id !== session?.user.id).length ===
                      0 && (
                      <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                        No other users found. Invite team members first.
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating || !newName.trim()}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  >
                    {creating && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Create Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <Card className="border-border/40 bg-card/80 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No projects yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              {isAdmin
                ? 'Get started by creating your first project. Click "New Project" above.'
                : "You haven't been added to any projects yet. Ask your admin to add you."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group"
            >
              <Card className="border-border/40 bg-card/80 backdrop-blur-sm hover:border-violet-500/30 transition-all duration-300 h-full relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="text-lg truncate group-hover:text-violet-300 transition-colors">
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <ListTodo className="w-4 h-4" />
                        <span>
                          {project._count.tasks} task
                          {project._count.tasks !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>
                          {project.members.length} member
                          {project.members.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map((member) => (
                        <Avatar
                          key={member.id}
                          className="w-7 h-7 border-2 border-card"
                        >
                          <AvatarFallback className="text-[10px] bg-accent">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project.members.length > 3 && (
                        <Avatar className="w-7 h-7 border-2 border-card">
                          <AvatarFallback className="text-[10px] bg-violet-500/20 text-violet-400">
                            +{project.members.length - 3}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Created{" "}
                      {new Date(project.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>

                {/* Bottom gradient accent */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
