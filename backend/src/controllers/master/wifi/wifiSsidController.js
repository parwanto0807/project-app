import { prisma } from "../../../config/db.js";

export const getAllWifiSsids = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    const where = {};
    if (activeOnly === "true") {
      where.isActive = true;
    }

    const wifiSsids = await prisma.wifiSsid.findMany({
      where,
      orderBy: { name: "asc" },
    });
    res.json(wifiSsids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createWifiSsid = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nama SSID wajib diisi" });
    }

    const wifiSsid = await prisma.wifiSsid.create({
      data: {
        name,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json(wifiSsid);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Nama SSID sudah ada" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateWifiSsid = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const wifiSsid = await prisma.wifiSsid.update({
      where: { id },
      data: {
        name,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });
    res.json(wifiSsid);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Nama SSID sudah ada" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteWifiSsid = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.wifiSsid.delete({ where: { id } });
    res.json({ message: "Wifi SSID berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
