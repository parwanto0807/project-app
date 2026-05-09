"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock, Calendar } from "lucide-react";

interface StatsProps {
  stats: {
    total: number;
    hadir: number;
    terlambat: number;
    izin: number;
    alfa: number;
  } | null;
}

export function AttendanceStats({ stats }: StatsProps) {
  const items = [
    {
      title: "Total Presence",
      value: stats?.total || 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "On Time",
      value: stats?.hadir || 0,
      icon: UserCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Late arrivals",
      value: stats?.terlambat || 0,
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Permission/Sick",
      value: stats?.izin || 0,
      icon: Calendar,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Absent",
      value: stats?.alfa || 0,
      icon: UserX,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {items.map((item, index) => (
        <Card key={index} className="border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {item.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{item.value}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Today's records
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
