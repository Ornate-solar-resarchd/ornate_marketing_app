"use client";

import { FileText, FolderOpen, Clock, TrendingUp } from "lucide-react";

interface StatsRowProps {
  totalFiles: number;
  totalSections: number;
  lastUploaded: string | null;
}

const stats = [
  {
    key: "files",
    icon: FileText,
    label: "Total Files",
    gradient: "from-[#E8611A] to-[#FF8A50]",
    bg: "bg-orange-50",
  },
  {
    key: "sections",
    icon: FolderOpen,
    label: "Sections",
    gradient: "from-[#3B82F6] to-[#60A5FA]",
    bg: "bg-blue-50",
  },
  {
    key: "upload",
    icon: Clock,
    label: "Last Upload",
    gradient: "from-[#10B981] to-[#34D399]",
    bg: "bg-emerald-50",
  },
];

export default function StatsRow({
  totalFiles,
  totalSections,
  lastUploaded,
}: StatsRowProps) {
  const values = [
    totalFiles.toString(),
    totalSections.toString(),
    lastUploaded ? new Date(lastUploaded).toLocaleDateString() : "No uploads",
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-children">
      {stats.map((stat, index) => (
        <div
          key={stat.key}
          className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
            <stat.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {values[index]}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
