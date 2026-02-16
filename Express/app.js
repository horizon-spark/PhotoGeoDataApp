import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import { getGpsFromFile } from "./helpers/getGpsFromFile.js";
import GpsData from "./models/GpsData.js";

const __dirname = path.resolve();
const app = express();

app.set("view engine", "pug");

await mongoose.connect("mongodb://localhost:27017/gpsdb");

app.use(express.static(__dirname));
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.render("index", {
    title: "Главная страница",
  });
});

app.post("/upload", upload.single("filedata"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("Ошибка при загрузке файла");
    }

    const clientIp = req.ip || req.connection.remoteAddress;

    console.log(`📸 Файл загружен: ${req.file.originalname} с IP ${clientIp}`);

    const gpsResult = await getGpsFromFile(req.file, clientIp);

    await fs
      .unlink(req.file.path)
      .catch((e) => console.log("Не удалось удалить файл:", e.message));

    res.render("results", { ...gpsResult, title: "Результат" });
  } catch (error) {
    console.error("Ошибка сервера:", error);
    res.status(500).send("Внутренняя ошибка сервера");
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const stats = await GpsData.aggregate([
      {
        $group: {
          _id: null,
          totalUploads: { $sum: 1 },
          filesWithGps: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$coordinates.lat", null] },
                    { $ne: ["$coordinates.lon", null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          avgFileSize: { $avg: "$fileSize" },
          uniqueIps: { $addToSet: "$clientIp" },
        },
      },
      {
        $project: {
          _id: 0,
          totalUploads: 1,
          filesWithGps: 1,
          percentWithGps: {
            $multiply: [{ $divide: ["$filesWithGps", "$totalUploads"] }, 100],
          },
          avgFileSizeMB: { $divide: ["$avgFileSize", 1024 * 1024] },
          uniqueVisitors: { $size: "$uniqueIps" },
        },
      },
    ]);

    res.json(stats[0] || { totalUploads: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/stats", async (req, res) => {
  try {
    const recentUploads = await GpsData.find()
      .sort({ uploadDate: -1 })
      .limit(10)
      .select("fileName uploadDate coordinates hasGps");

    res.render("stats", { recentUploads });
  } catch (error) {
    res.status(500).send("Ошибка загрузки статистики");
  }
});

app.listen(3000, () => {
  console.log("🚀 Сервер запущен на http://localhost:3000");
});
