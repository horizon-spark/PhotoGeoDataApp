import ExifReader from "exifreader";
import fs from "fs/promises";
import GpsData from "../models/GpsData.js";

export const getGpsFromFile = async (file, clientIp) => {
  try {
    let gpsInfo = {
      lat: null,
      lon: null,
      alt: null,
    };

    const fileBuffer = await fs.readFile(file.path);

    const tags = ExifReader.load(fileBuffer, { expanded: true });

    if (tags.gps) {
      console.log(
        `Сервер - полученные GPS: ${tags.gps.Latitude}:${tags.gps.Longitude}`,
      );
      gpsInfo = {
        lat: tags.gps.Latitude,
        lon: tags.gps.Longitude,
        alt: tags.gps.Altitude || null,
      };
    }

    const gpsData = new GpsData({
      fileName: file.originalname,
      fileSize: file.size,
      filePath: file.path,
      mimeType: file.mimetype,
      clientIp: clientIp,
      coordinates: gpsInfo,
      exifData: tags,
    });

    await gpsData.save();
    console.log(`Данные сохранены в MongoDB, ID: ${gpsData._id}`);

    return {
      ...gpsInfo,
      dbId: gpsData._id,
      hasGps: gpsData.hasGps,
    };
  } catch (err) {
    console.log("Ошибка обработки: ", err.message);

    try {
      const failedUpload = new GpsData({
        fileName: file.originalname,
        fileSize: file.size,
        filePath: file.path,
        mimeType: file.mimetype,
        clientIp: clientIp,
        coordinates: { lat: null, lon: null, alt: null },
        exifData: { error: err.message },
      });

      await failedUpload.save();
    } catch (saveErr) {
      console.log("Не удалось сохранить ошибку: ", saveErr.message);
    }
  }
  return { lat: null, lon: null, alt: null, dbId: null };
};
