import express from "express";
import multer from "multer";
import path from "path";

import { getGpsFromFile } from "./helpers.js";

const __dirname = path.resolve();
const app = express();

app.use(express.static(__dirname));
app.use(multer({ dest: "uploads" }).single("filedata"));

app.post("/upload", async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).send("Ошибка при загрузке файла");
    } else {
      const { lat, lon, alt } = await getGpsFromFile(file.path);

      let responseMessage = "";

      if (lat && lon) {
        const altText = alt ? `Высота: ${alt} м` : "Высота не определена";
        responseMessage = `Координаты: ${lat}, ${lon}\n${altText}`;
        console.log(responseMessage);
      } else {
        responseMessage = "GPS данные не найдены в файле";
        console.log(responseMessage);
      }
      res.send(responseMessage);
    }
  } catch (error) {
    console.error("Ошибка сервера: ", error);
    res.status(500).send("Внутренняя ошибка сервера");
  }
});
app.listen(3000, () => {
  console.log("Сервер запущен на http://localhost:3000");
});
