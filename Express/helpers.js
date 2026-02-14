import ExifReader from "exifreader";
import fs from "fs/promises";

export const getGpsFromFile = async (path) => {
  try {
    const fileBuffer = await fs.readFile(path);

    const tags = await ExifReader.load(fileBuffer, { expanded: true });

    if (tags.gps) {
      return {
        lat: tags.gps.Latitude,
        lon: tags.gps.Longitude,
        alt: tags.gps.Altitude,
      };
    }

    return { lat: null, lon: null, alt: null };
  } catch (err) {
    console.log("Ошибка: ", err.message);
    return { lat: null, lon: null, alt: null };
  }
};
