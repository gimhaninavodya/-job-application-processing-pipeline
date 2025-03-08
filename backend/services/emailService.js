import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Function to get the applicant's timezone using their email domain
const getTimeZone = async (email) => {
  try {
    const domain = email.split("@")[1];
    const response = await axios.get(`https://api.ipgeolocation.io/timezone?apiKey=${process.env.IPGEO_API_KEY}&domain=${domain}`);
    return response.data.timezone;
  } catch (error) {
    console.error("Error fetching timezone:", error);
    return "UTC";
  }
};


// Function to send the follow-up email at a convenient time
export const sendFollowUpEmail = async (applicantEmail, applicantName) => {
  try {
    const userTimezone = await getTimeZone(applicantEmail);
    const now = new Date();
    const targetTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
    targetTime.setHours(9, 0, 0, 0); // Schedule at 9 AM in their timezone

    const delay = targetTime - now;
    const adjustedDelay = delay > 0 ? delay : 24 * 60 * 60 * 1000 + delay;
    // Handle past 9 AM case

    // this is for testing time -> 10 * 1000 (email send after 10s)

    setTimeout(async () => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: applicantEmail,
        subject: "Your Application is Under Review",
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Hello <strong>${applicantName}</strong>,</p>
            <p>Thank you for applying! Your CV is under review. We will get back to you soon.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>Metana Team</strong></p>
            <hr>
            <p style="font-size: 12px; color: gray;">This is an automated message. Please do not reply.</p>
          </div>
        `,
      };
      

      await transporter.sendMail(mailOptions);
      console.log(`Follow-up email sent to ${applicantEmail} at ${new Date().toISOString()}`);
    }, adjustedDelay);

  } catch (error) {
    console.error("Error sending follow-up email:", error);
  }
};
