document.addEventListener("DOMContentLoaded", () => {

    const micButton = document.getElementById("micButton");
    const statusText = document.getElementById("statusText");

    if (!micButton || !statusText) {
        console.error("Missing DOM elements.");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech Recognition not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    let isListening = false;

    function setState(text) {
        statusText.innerText = text;
    }

    function resetToIdle() {
        isListening = false;
        setState("Idle");
    }

    micButton.addEventListener("click", () => {

        if (isListening) {
            recognition.stop();
            resetToIdle();
            return;
        }

        isListening = true;
        setState("Listening...");
        recognition.start();
    });

    recognition.onresult = async (event) => {

        const transcript = event.results[0][0].transcript.trim();
        console.log("Transcript:", transcript);

        setState("Processing...");

        try {

            const response = await fetch("https://sync-backend-bcum.onrender.com/create-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript })
            });

            const data = await response.json();

            if (data.success) {
                setState("Event Created ✅");
            } else {
                setState(data.message || "Could not detect date");
            }

        } catch (error) {
            console.error("Frontend Error:", error);
            setState("Server error");
        }

        setTimeout(() => {
            resetToIdle();
        }, 2000);
    };

    recognition.onerror = (event) => {
        console.error("Speech Error:", event.error);
        resetToIdle();
    };

    recognition.onend = () => {
        isListening = false;
    };

});
