import mongoose from "mongoose";

const gpsDataSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    coordinates: {
      lat: {
        type: Number,
        min: -90,
        max: 90,
        validate: {
          validator: function (v) {
            return v === null || (v >= -90 && v <= 90);
          },
          message: "Широта должна быть от -90 до 90",
        },
      },
      lon: {
        type: Number,
        min: -180,
        max: 180,
        validate: {
          validator: function (v) {
            return v === null || (v >= -180 && v <= 180);
          },
          message: "Долгота должна быть от -180 до 180",
        },
      },
      altitude: {
        type: Number,
        default: null,
      },
    },
    exifData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    clientIp: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

gpsDataSchema.virtual("hasGps").get(function () {
  return (
    this.coordinates &&
    this.coordinates.lat !== null &&
    this.coordinates.lon !== null
  );
});

gpsDataSchema.methods.toApiResponse = function () {
  return {
    id: this._id,
    fileName: this.fileName,
    uploadDate: this.uploadDate,
    hasGps: this.hasGps,
    coordinates: this.hasGps
      ? {
          lat: this.coordinates.lat,
          lon: this.coordinates.lon,
          alt: this.coordinates.altitude,
          googleMapsUrl: `https://www.google.com/maps?q=${this.coordinates.lat},${this.coordinates.lon}`,
        }
      : null,
  };
};

const GpsData = mongoose.model("GpsData", gpsDataSchema);

export default GpsData;
