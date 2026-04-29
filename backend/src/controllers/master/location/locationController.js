import { prisma } from "../../../config/db.js";

export const getAllLocations = async (req, res) => {
  try {
    const locations = await prisma.attendanceLocation.findMany({
      orderBy: { name: "asc" },
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createLocation = async (req, res) => {
  try {
    const { name, latitude, longitude, radius, isActive } = req.body;
    const location = await prisma.attendanceLocation.create({
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: radius ? parseFloat(radius) : 100,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, radius, isActive } = req.body;
    const location = await prisma.attendanceLocation.update({
      where: { id },
      data: {
        name,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
        radius: radius !== undefined ? parseFloat(radius) : undefined,
        isActive,
      },
    });
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attendanceLocation.delete({ where: { id } });
    res.json({ message: "Lokasi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
