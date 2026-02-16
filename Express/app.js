import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import { getGpsFromFile } from "./helpers/getGpsFromFile.js";
import GpsData from "./models/GpsData.js";

const __dirname = path.resolve();
const app = express();

// Подключение к MongoDB
await mongoose.connect("mongodb://localhost:27017/gpsdb");
console.log("✅ Подключено к MongoDB");

app.use(express.static(__dirname));
app.use(express.json()); // для парсинга JSON

const upload = multer({ dest: "uploads/" });

// Основной endpoint для загрузки
app.post("/upload", upload.single("filedata"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("Ошибка при загрузке файла");
    }

    // Получаем IP клиента
    const clientIp = req.ip || req.connection.remoteAddress;

    console.log(`📸 Файл загружен: ${req.file.originalname} с IP ${clientIp}`);

    const gpsResult = await getGpsFromFile(req.file, clientIp);

    // Формируем HTML ответ
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Результат</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          .success { color: green; }
          .info { background: #f0f0f0; padding: 10px; border-radius: 5px; }
          .map-link { background: #4285f4; color: white; padding: 5px 10px; 
                     text-decoration: none; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h2>Результат обработки</h2>
    `;

    if (gpsResult.hasGps) {
      html += `
        <div class="info">
          <h3 class="success">✅ GPS данные найдены!</h3>
          <p>Широта: ${gpsResult.lat}</p>
          <p>Долгота: ${gpsResult.lon}</p>
          <p>Высота: ${gpsResult.alt || "не определена"} м</p>
          <p>ID в БД: ${gpsResult.dbId}</p>
          <a class="map-link" href="https://www.google.com/maps?q=${gpsResult.lat},${gpsResult.lon}" 
             target="_blank">🌍 Открыть на карте</a>
        </div>
      `;
    } else {
      html += `
        <div class="info">
          <h3>❌ GPS данные не найдены</h3>
          <p>Файл сохранен в истории (ID: ${gpsResult.dbId || "не сохранен"})</p>
        </div>
      `;
    }

    html += `
      <br>
      <a href="/">← Загрузить другой файл</a>
      <br><br>
      <a href="/stats">📊 Статистика</a>
      </body>
      </html>
    `;

    // Очищаем загруженный файл
    await fs
      .unlink(req.file.path)
      .catch((e) => console.log("Не удалось удалить файл:", e.message));

    res.send(html);
  } catch (error) {
    console.error("Ошибка сервера:", error);
    res.status(500).send("Внутренняя ошибка сервера");
  }
});

// API endpoint для получения статистики
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

// HTML страница со статистикой
app.get("/stats", async (req, res) => {
  try {
    const recentUploads = await GpsData.find()
      .sort({ uploadDate: -1 })
      .limit(10)
      .select("fileName uploadDate coordinates hasGps");

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Статистика</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>📊 Статистика загрузок</h2>
        <div id="stats">Загрузка...</div>
        
        <h3>Последние 10 загрузок</h3>
        <table>
          <tr>
            <th>Файл</th>
            <th>Дата</th>
            <th>GPS</th>
          </tr>
    `;

    recentUploads.forEach((u) => {
      html += `
        <tr>
          <td>${u.fileName}</td>
          <td>${u.uploadDate.toLocaleString()}</td>
          <td>${u.hasGps ? "✅" : "❌"}</td>
        </tr>
      `;
    });

    html += `
        </table>
        <br>
        <a href="/">← Назад</a>
        <script>
          fetch('/api/stats')
            .then(r => r.json())
            .then(s => {
              document.getElementById('stats').innerHTML = \`
                <p>Всего загрузок: \${s.totalUploads}</p>
                <p>С GPS: \${s.filesWithGps} (\${s.percentWithGps?.toFixed(1)}%)</p>
                <p>Ср. размер: \${s.avgFileSizeMB?.toFixed(2)} MB</p>
                <p>Уникальных посетителей: \${s.uniqueVisitors}</p>
              \`;
            });
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    res.status(500).send("Ошибка загрузки статистики");
  }
});

app.listen(3000, () => {
  console.log("🚀 Сервер запущен на http://localhost:3000");
});
