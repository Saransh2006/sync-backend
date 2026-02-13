const introScreen = document.getElementById("introScreen");
const mainApp = document.getElementById("mainApp");

window.addEventListener("load", () => {

    // Slight delay for dramatic effect
    setTimeout(() => {
        introScreen.style.opacity = "0";
        introScreen.style.transform = "scale(1.02)";

        setTimeout(() => {
            introScreen.style.display = "none";
            mainApp.classList.remove("hidden");
        }, 800);

    }, 1800); // shorter than 2s for sharper feel
});



// ==========================
// SYNC - State Definitions
// ==========================

const STATES = {
    IDLE: "IDLE",
    LISTENING: "LISTENING",
    PROCESSING: "PROCESSING",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR"
};

let currentState = STATES.IDLE;


// ==========================
// DOM References
// ==========================

const micButton = document.getElementById("micButton");
const statusText = document.getElementById("statusText");
const pulseCore = document.getElementById("pulseCore");


function setState(newState) {
    currentState = newState;

    // Remove all dynamic classes first
    micButton.classList.remove("idle", "listening", "processing", "success", "error");

    switch (newState) {

        case STATES.IDLE:
            micButton.classList.add("idle");
            micButton.disabled = false;
            statusText.innerText = "Idle";
            break;

        case STATES.LISTENING:
            micButton.classList.add("listening");
            micButton.disabled = false;
            statusText.innerText = "Listening...";
            break;

        case STATES.PROCESSING:
            micButton.classList.add("processing");
            micButton.disabled = true;
            statusText.innerText = "Processing...";
            break;

        case STATES.SUCCESS:
            micButton.classList.add("success");
            statusText.innerText = "Added";
            setTimeout(() => setState(STATES.IDLE), 1500);
            break;

        case STATES.ERROR:
            micButton.classList.add("error");
            statusText.innerText = "Failed. Try again.";
            setTimeout(() => setState(STATES.IDLE), 2000);
            break;
    }
}

setState(STATES.IDLE);

micButton.addEventListener("click", () => {

    if (currentState === STATES.IDLE) {
        startListening();
    }

    else if (currentState === STATES.LISTENING) {
        stopListening();
    }

});

let recognition;
let transcript = "";

function setupRecognition() {

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech Recognition not supported in this browser.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        transcript = event.results[0][0].transcript;
    };

    recognition.onspeechend = () => {
        recognition.stop();

        if (transcript.trim() !== "") {
            setState(STATES.PROCESSING);
            sendToBackend(transcript);
        } else {
            setState(STATES.IDLE);
        }
    };

    recognition.onerror = () => {
        setState(STATES.ERROR);
    };
}

function startListening() {
    transcript = "";
    setState(STATES.LISTENING);
    recognition.start();
}

function stopListening() {
    recognition.stop();
}

async function sendToBackend(transcript) {

    try {
        // For now, simple parsing (temporary)
        // Later we'll use OpenAI
        const title = transcript;
        const date = "2026-02-19";  // temporary hardcoded
        const time = "10:00";       // temporary hardcoded

        const response = await fetch("/create-event", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ transcript })

        });

        const result = await response.json();

        if (result.success) {
            setState(STATES.SUCCESS);
        } else {
            setState(STATES.ERROR);
        }

    } catch (error) {
        console.error("Frontend Error:", error);
        setState(STATES.ERROR);
    }
}


setupRecognition();

