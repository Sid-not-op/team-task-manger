import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  FolderKanban,
  BarChart3,
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: FolderKanban,
      title: "Project Management",
      description: "Organize work into projects with clear ownership and team assignments.",
    },
    {
      icon: CheckCircle2,
      title: "Task Tracking",
      description: "Kanban-style boards to track task progress from To Do to Done.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Assign tasks to team members and manage roles with RBAC.",
    },
    {
      icon: BarChart3,
      title: "Dashboard Analytics",
      description: "Real-time overview of task completion, overdue items, and progress.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-500/15 to-purple-500/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-500/15 to-cyan-500/5 blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-500/5 to-violet-500/5 blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-sm">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20">
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Team Task Manager
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Manage your team&apos;s work{" "}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              effortlessly
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            A collaborative task management platform with Kanban boards,
            role-based access, and real-time progress tracking. Built for
            modern teams.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 h-12 px-8 text-base"
              >
                Start for free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-5xl w-full">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm hover:border-violet-500/30 hover:bg-card/80 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
                <feature.icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground">
        Built with Next.js, Prisma, and Shadcn UI
      </footer>
    </div>
  );
}
