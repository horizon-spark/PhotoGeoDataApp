import mongoose from "mongoose";
import GpsData from "../models/GpsData.js";

const main = async () => {
  await mongoose.connect("mongodb://localhost:27017/gpsdb");
  const res = await GpsData.deleteMany({});
  console.log(res);
};

main()
  .catch(console.log)
  .finally(async () => await mongoose.disconnect());
