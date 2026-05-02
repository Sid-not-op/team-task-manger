"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Users,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  totalProjects: number;
  totalMembers?: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  updatedAt: string;
  assignees: { id: string; name: string; email: string }[];
  project: { id: string; name: string };
}

const statusConfig = {
  TODO: {
    label: "To Do",
    color: "bg-slate-500/15 text-slate-400 border-slate-500/25",
    dot: "bg-slate-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    dot: "bg-blue-400",
  },
  DONE: {
    label: "Done",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    dot: "bg-emerald-400",
  },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentTasks(data.recentTasks);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Tasks",
      value: stats?.totalTasks ?? 0,
      icon: ListTodo,
      gradient: "from-violet-600 to-indigo-600",
      shadow: "shadow-violet-500/20",
      bg: "bg-violet-500/10",
    },
    {
      title: "In Progress",
      value: stats?.inProgressTasks ?? 0,
      icon: Clock,
      gradient: "from-blue-600 to-cyan-600",
      shadow: "shadow-blue-500/20",
      bg: "bg-blue-500/10",
    },
    {
      title: "Completed",
      value: stats?.doneTasks ?? 0,
      icon: CheckCircle2,
      gradient: "from-emerald-600 to-teal-600",
      shadow: "shadow-emerald-500/20",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Overdue",
      value: stats?.overdueTasks ?? 0,
      icon: AlertTriangle,
      gradient: "from-red-600 to-rose-600",
      shadow: "shadow-red-500/20",
      bg: "bg-red-500/10",
    },
  ];

  const secondaryCards = [
    {
      title: "Projects",
      value: stats?.totalProjects ?? 0,
      icon: FolderKanban,
      href: "/dashboard/projects",
    },
    ...(session?.user.role === "ADMIN" && stats?.totalMembers !== undefined
      ? [
          {
            title: "Team Members",
            value: stats.totalMembers,
            icon: Users,
            href: "#",
          },
        ]
      : []),
  ];

  // Calculate completion percentage
  const total = stats?.totalTasks ?? 0;
  const done = stats?.doneTasks ?? 0;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {session?.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your workspace
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden relative group hover:border-border/60 transition-all duration-300"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center`}
                >
                  <card.icon
                    className={`w-5 h-5 bg-gradient-to-br ${card.gradient} bg-clip-text`}
                    style={{
                      color: `var(--tw-gradient-from)`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
            {/* Subtle gradient border effect on hover */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />
          </Card>
        ))}
      </div>

      {/* Secondary Stats + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Completion Progress */}
        <Card className="border-border/40 bg-card/80 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Task Completion</CardTitle>
            <CardDescription>Overall progress across tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  {completionPct}%
                </span>
                <span className="text-sm text-muted-foreground pb-1">
                  complete
                </span>
              </div>
              <div className="w-full h-3 bg-accent/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{done} completed</span>
                <span>{total - done} remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="border-border/40 bg-card/80 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status Breakdown</CardTitle>
            <CardDescription>Tasks grouped by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  label: "To Do",
                  value: stats?.todoTasks ?? 0,
                  color: "bg-slate-400",
                  bar: "bg-slate-500/40",
                },
                {
                  label: "In Progress",
                  value: stats?.inProgressTasks ?? 0,
                  color: "bg-blue-400",
                  bar: "bg-blue-500/40",
                },
                {
                  label: "Done",
                  value: stats?.doneTasks ?? 0,
                  color: "bg-emerald-400",
                  bar: "bg-emerald-500/40",
                },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                      />
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-accent/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.bar} rounded-full transition-all duration-500`}
                      style={{
                        width: total > 0 ? `${(item.value / total) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="border-border/40 bg-card/80 backdrop-blur-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Access</CardTitle>
            <CardDescription>Jump to key sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {secondaryCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <card.icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {card.value} total
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>
                Latest updated tasks across your projects
              </CardDescription>
            </div>
            <Link
              href="/dashboard/projects"
              className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No tasks yet. Create a project to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => {
                const config = statusConfig[task.status];
                const isOverdue =
                  task.dueDate &&
                  task.status !== "DONE" &&
                  new Date(task.dueDate) < new Date();

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-accent/20 hover:bg-accent/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {task.project.name}
                          {task.assignees.length > 0 && ` • ${task.assignees.map(a => a.name).join(", ")}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {isOverdue && (
                        <Badge
                          variant="secondary"
                          className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px]"
                        >
                          Overdue
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className={`${config.color} text-[10px]`}
                      >
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
