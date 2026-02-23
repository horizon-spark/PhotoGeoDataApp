import GpsData from "../models/GpsData.js";

export const getGpsFromExif = async (file, rawExif, clientIp) => {
  let exif = null;

  if (rawExif) {
    try {
      let gpsInfo = {
        lat: null,
        lon: null,
        alt: null,
      };

      exif = JSON.parse(rawExif);

      if (exif.GPSLatitude && exif.GPSLongitude) {
        console.log(
          `Сервер - полученные GPS: ${exif.GPSLatitude}:${exif.GPSLongitude}`,
        );
        gpsInfo = {
          lat: exif.GPSLatitude,
          lon: exif.GPSLongitude,
          alt: exif.GPSAltitude || null,
        };
      }

      const gpsData = new GpsData({
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        clientIp: clientIp,
        coordinates: gpsInfo,
        exifData: rawExif,
      });

      await gpsData.save();
      console.log(`💾 Данные сохранены в MongoDB, ID: ${gpsData._id}`);

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
  }
  return { lat: null, lon: null, alt: null, dbId: null };
};
