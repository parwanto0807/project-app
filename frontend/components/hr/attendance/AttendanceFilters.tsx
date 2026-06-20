"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, RotateCcw, Calendar as CalendarIcon, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllTeam } from "@/lib/action/master/team/getAllTeam";

interface FilterProps {
  onFilter: (filters: any) => void;
  onReset: () => void;
  invalidCount?: number;
  showInvalidOnly?: boolean;
}

export function AttendanceFilters({ onFilter, onReset, invalidCount = 0, showInvalidOnly = false }: FilterProps) {
  const getTodayStr = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const getStartDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const [employeeName, setEmployeeName] = useState("");
  const [status, setStatus] = useState("ALL");
  const [startDate, setStartDate] = useState(getStartDateStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [groupByTeam, setGroupByTeam] = useState(false);
  const [showInvalid, setShowInvalid] = useState(showInvalidOnly);
  const [teamId, setTeamId] = useState("ALL");
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    const loadTeams = async () => {
      const res = await getAllTeam(1, 100);
      if (res.success && res.data) {
        setTeams(res.data);
      }
    };
    loadTeams();
  }, []);

  const handleApply = () => {
    onFilter({ employeeName, status, startDate, endDate, groupByTeam, teamId, showInvalid });
  };

  const handleReset = () => {
    setEmployeeName("");
    setStatus("ALL");
    setTeamId("ALL");
    setStartDate(getStartDateStr());
    setEndDate(getTodayStr());
    setGroupByTeam(false);
    setShowInvalid(false);
    onReset();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employee..."
          className="pl-10 bg-white/50 border-none focus-visible:ring-cyan-500/50 rounded-xl"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
        />
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[150px] bg-white/50 border-none rounded-xl">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="HADIR">Hadir</SelectItem>
          <SelectItem value="TERLAMBAT">Terlambat</SelectItem>
          <SelectItem value="IZIN">Izin/Sakit</SelectItem>
          <SelectItem value="ALFA">Alfa</SelectItem>
        </SelectContent>
      </Select>

      <Select value={teamId} onValueChange={setTeamId}>
        <SelectTrigger className="w-[180px] bg-white/50 border-none rounded-xl">
          <SelectValue placeholder="Team" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Semua Team</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.namaTeam}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="w-[160px] bg-white/50 border-none rounded-xl"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span className="text-muted-foreground text-xs font-bold uppercase">To</span>
        <Input
          type="date"
          className="w-[160px] bg-white/50 border-none rounded-xl"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2 px-3 py-2 bg-white/50 rounded-xl">
        <Switch 
          id="group-by-team" 
          checked={groupByTeam}
          onCheckedChange={setGroupByTeam}
        />
        <Label htmlFor="group-by-team" className="text-xs font-bold text-gray-600 cursor-pointer flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Group by Team
        </Label>
      </div>

      <Button
        variant={showInvalid ? "destructive" : "outline"}
        onClick={() => {
          const next = !showInvalid;
          setShowInvalid(next);
          onFilter({ employeeName, status, startDate, endDate, groupByTeam, teamId, showInvalid: next });
        }}
        className={`rounded-xl border-red-200 transition-colors ${showInvalid ? 'shadow-lg shadow-red-500/20' : 'hover:bg-red-50 hover:text-red-600 text-gray-600'}`}
      >
        ⚠️ Cek Data Invalid
        {invalidCount > 0 && (
          <span className="ml-2 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {invalidCount}
          </span>
        )}
      </Button>

      <div className="flex items-center gap-2 ml-auto">
        <Button 
          onClick={handleApply}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/20 px-6"
        >
          Apply Filter
        </Button>
        <Button 
          variant="outline" 
          onClick={handleReset}
          className="rounded-xl border-cyan-200 hover:bg-cyan-50"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
