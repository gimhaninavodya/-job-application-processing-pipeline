import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";
import bufferToStream from "../utils/bufferToStream.js";

dotenv.config();

const credentials = JSON.parse(fs.readFileSync("credentials.json"));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth });

// Upload file to Google Drive
export const uploadToGoogleDrive = async (file) => {
  try {
    const fileStream = bufferToStream(file.buffer);
    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        mimeType: file.mimetype,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: file.mimetype,
        body: fileStream,
      },
    });

    return response.data.id;
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    throw error;
  }
};

// Set file to public & get public URL
export const getPublicUrl = async (fileId) => {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    return `https://drive.google.com/uc?id=${fileId}`;
  } catch (error) {
    console.error("Error setting public URL:", error);
    throw error;
  }
};
