require("dotenv").config();

const express = require("express");
const cors = require("cors");
const chrono = require("chrono-node");
const { google } = require("googleapis");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ================= OAUTH SETUP ================= */

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client
});

/* ================= BASIC ROUTE ================= */

app.get("/", (req, res) => {
    res.send("SYNC backend running");
});

/* ================= AUTH ROUTES (ONLY FOR GENERATING REFRESH TOKEN) ================= */

app.get("/auth", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/calendar"],
        prompt: "consent"
    });

    res.redirect(url);
});

app.get("/oauth2callback", async (req, res) => {
    const code = req.query.code;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log("TOKENS:", tokens);
        res.send("Refresh token generated. Check server logs.");
    } catch (error) {
        console.error("FULL ERROR:", error.response?.data || error);
        res.send("Error generating token. Check logs.");
    }
});

/* ================= CREATE EVENT ================= */

app.post("/create-event", async (req, res) => {
    const { transcript } = req.body;

    try {

        if (!transcript || transcript.trim() === "") {
            return res.json({
                success: false,
                message: "Empty transcript"
            });
        }

        const parsedResults = chrono.parse(transcript);

        if (!parsedResults.length) {
            return res.json({
                success: false,
                message: "No date/time detected"
            });
        }

        const parsedDate = parsedResults[0].start.date();

        const startDateTime = parsedDate;
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        const event = {
            summary: transcript,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: "Asia/Kolkata"
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: "Asia/Kolkata"
            }
        };

        await calendar.events.insert({
            calendarId: "primary",
            resource: event
        });

        res.json({ success: true });

    } catch (error) {
        console.error("Calendar Error:", error);
        res.json({
            success: false,
            message: "Server error"
        });
    }
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
