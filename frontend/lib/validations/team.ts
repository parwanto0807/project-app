// /types/team.ts
import { Karyawan } from "./karyawan"

export interface Team {
  id: string
  namaTeam: string
  deskripsi?: string | null
  createdAt: string
  updatedAt: string

  karyawan: TeamKaryawan[]
}

export interface TeamKaryawan {
  id: string
  teamId: string
  karyawanId: string

  team?: Team
  karyawan?: Karyawan
}
