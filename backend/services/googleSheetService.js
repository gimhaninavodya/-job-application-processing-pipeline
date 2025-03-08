import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";

/**
 * Save extracted CV data to Google Sheets
 * @param {Object} data - Extracted CV data
 */

export const saveToGoogleSheet = async (data) => {
  try {
    if (!data || !data.personal_info) {
      throw new Error("Invalid CV data: personal_info is missing");
    }

    const values = [[
      data.personal_info?.name || "N/A",
      data.personal_info?.email || "N/A",
      data.personal_info?.phone || "N/A",
      data.education.length > 0 ? data.education.join("; ") : "N/A",
      data.qualifications.length > 0 ? data.qualifications.join("; ") : "N/A",
      data.projects.length > 0 ? data.projects.join("; ") : "N/A",
      data.cv_public_link || "N/A"
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:G2`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      resource: { values },
    });

    console.log("CV data saved successfully!");
  } catch (error) {
    console.error("Error saving CV data:", error);
  }
};
