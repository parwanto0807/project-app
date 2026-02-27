// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

import { prisma} from '../config/db.js';

export default async function checkIfNewDevice(userId, deviceId) {
  // Cek di database trustedDevices apakah deviceId sudah pernah disimpan
  const trusted = await prisma.trustedDevice.findFirst({
    where: { userId, deviceId }
  });
  // Kalau tidak ditemukan berarti device baru (return true)
  return !trusted;
}
