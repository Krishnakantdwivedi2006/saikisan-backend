import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

// Validate early (fail fast)
if (!process.env.TWILIO_ACCOUNT_ID) throw new Error("Missing TWILIO_ACCOUNT_SID");
if (!process.env.TWILIO_API_SECRET) throw new Error("Missing TWILIO_AUTH_TOKEN");
if (!process.env.TWILIO_VERIFY_SERVICE_SID) throw new Error("Missing TWILIO_VERIFY_SERVICE_SID");

const client = twilio(
  process.env.TWILIO_ACCOUNT_ID,
  process.env.TWILIO_API_SECRET
);

export const VERIFY_SERVICE_ID = process.env.TWILIO_VERIFY_SERVICE_ID;

export default client;
