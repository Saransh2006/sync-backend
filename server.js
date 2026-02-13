require("dotenv").config();
const chrono = require("chrono-node");

const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
app.use(cors());
app.use(express.json());


// ================= OAuth Setup =================

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://sync-backend-bcum.onrender.com/oauth2callback"

);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client
});


// ================= Routes =================

// OAuth routes
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
        res.send("Refresh token generated. Check terminal.");
    } catch (error) {
        console.error("FULL ERROR:", error.response?.data || error);
        res.send("Error generating token. Check terminal.");
    }
});


// ================= Create Event =================

app.post("/create-event", async (req, res) => {
    const { transcript } = req.body;

    try {

        const parsedResults = chrono.parse(transcript);
        const parsedDate = parsedResults.length > 0
            ? parsedResults[0].start.date()
            : null;

        if (!parsedDate) {
            return res.status(400).json({ success: false });
        }

        // Clean title (remove detected date text)
        let title = transcript;

if (parsedResults.length > 0) {
    const dateText = parsedResults[0].text;

    // Remove only the exact detected date portion
    title = transcript.replace(dateText, "").trim();
}

// If title becomes empty OR too short, fallback smartly
if (!title || title.length < 3) {
    title = transcript; // fallback to full transcript instead of generic name
}


        const startDateTime = parsedDate;
        const endDateTime = new Date(
            startDateTime.getTime() + 60 * 60 * 1000
        );

        const event = {
            summary: title,
            start: {
                dateTime: startDateTime,
                timeZone: "Asia/Kolkata"
            },
            end: {
                dateTime: endDateTime,
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
        res.status(500).json({ success: false });
    }
});


// ================= Static + Listen =================

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

