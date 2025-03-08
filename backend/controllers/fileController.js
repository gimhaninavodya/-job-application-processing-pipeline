import PDFParser from "pdf2json";
import axios from "axios";
import { uploadToGoogleDrive, getPublicUrl } from "../services/driveService.js";
import { saveToGoogleSheet } from "../services/googleSheetService.js";
import { sendFollowUpEmail } from "../services/emailService.js";

// Upload and process CV
export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const fileId = await uploadToGoogleDrive(req.file);
    if (!fileId) return res.status(500).json({ error: "Upload failed" });

    const fileLink = await getPublicUrl(fileId);

    // Extract CV details
    const cvData = await extractCVData(req.file.buffer);
    cvData.cvPublicLink = fileLink;

    console.log("Extracted CV data:", cvData);

    // Cleaning function for extracted CV sections
    function cleanText(text) {
      return text ? text.replace(/^:\s*/, "").trim() : "N/A";
    }

    // Convert extracted text into an array
    function convertToList(text) {
      return text !== "N/A" ? text.split(/\s*•\s*|\n+/).filter(Boolean) : [];
    }

    const cleanedCVData = {
      personal_info: cvData.personalInfo,
      education: convertToList(cvData.education),
      qualifications: convertToList(cvData.qualifications),
      projects: convertToList(cvData.projects),
      cv_public_link: cvData.cvPublicLink,
    };

    console.log("Fixed CV Data:", cleanedCVData);

    // Save to Google Sheets
    await saveToGoogleSheet(cleanedCVData);

    // Send cleaned data to webhook
    axios
      .post(
        "https://rnd-assignment.automations-3d6.workers.dev/",
        {
          cv_data: cleanedCVData,
          metadata: {
            applicant_name: cleanedCVData.personal_info.name,
            email: cleanedCVData.personal_info.email,
            status: "testing",
            cv_processed: true,
            processed_timestamp: new Date().toISOString(),
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Candidate-Email": "gimhanibrahmanage@gmail.com",
          },
        }
      )
      .then((response) => {
        console.log("Upload successful:", response.data);
      })
      .catch((error) => {
        console.error("Upload error:", error.response?.data || error.message);
    });

    // Schedule the email after processing
    setTimeout(() => {
      sendFollowUpEmail(cleanedCVData.personal_info.email, cleanedCVData.personal_info.name);
    }, 24 * 60 * 60 * 1000); // (Wait 1 day (24 hours in milliseconds))
    // testing time -> 10 * 1000  Wait 10 seconds for testing

    res.status(200).json({
      message: "CV processed successfully and webhook sent!",
      fileLink,
    });
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ error: "Something went wrong on the server" });
  }
};


// Extract text from PDF
export const extractCVData = (buffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) =>
      reject(errData.parserError)
    );
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const text = pdfData.Pages.map((page) =>
        page.Texts.map((t) => decodeURIComponent(t.R[0].T)).join(" ")
      ).join("\n");

      resolve(parseText(text));
    });

    pdfParser.parseBuffer(buffer);
  });
};


// Parse extracted text and get required sections
const parseText = (text) => {
  return {
    personalInfo: extractPersonalInfo(text),
    education: extractRequiredSection(text, [
      "EDUCATION",
      "Education",
      "Academic Background",
    ]),
    qualifications: extractRequiredSection(text, [
      "QUALIFICATIONS",
      "Qualifications",
    ]),
    projects: extractRequiredSection(text, [
      "PROJECTS",
      "Projects",
      "Personal Projects",
      "Group Projects",
    ]),
  };
};


// Extract only the required sections
const extractRequiredSection = (text, keywords) => {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}\\s*:(.*?)(?=[A-Z\\s]{4,}:|$)`, "s");
    const match = text.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  return "N/A";
};


// Extract personal details (name, email, phone) with precise regex
const extractPersonalInfo = (text) => {
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  const phoneMatch = text.match(
    /(?:\+\d{1,3}\s?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/
  );
  const nameMatch = text.match(
    /(?:Name[:\s]*)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/
  );

  return {
    name: nameMatch ? nameMatch[1].trim() : "N/A",
    email: emailMatch ? emailMatch[0] : "N/A",
    phone: phoneMatch ? phoneMatch[0] : "N/A",
  };
};
