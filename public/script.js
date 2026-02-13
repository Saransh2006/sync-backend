document.addEventListener("DOMContentLoaded", () => {

    const introScreen = document.getElementById("introScreen");
    const mainApp = document.getElementById("mainApp");
    const micButton = document.getElementById("micButton");
    const statusText = document.getElementById("statusText");

    // Smooth intro transition
    setTimeout(() => {
        introScreen.style.opacity = "0";
        setTimeout(() => {
            introScreen.style.display = "none";
            mainApp.style.display = "block";
        }, 600);
    }, 1200);

    if (!micButton || !statusText) {
        console.error("UI elements missing");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech Recognition not supported.");
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

            const response = await fetch("/create-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript })
            });

            const data = await response.json();

            if (data.success) {
                setState("Added");
            } else {
                setState(data.message || "No date detected");
            }

        } catch (error) {
            console.error(error);
            setState("Server error");
        }

        setTimeout(() => {
            resetToIdle();
        }, 1800);
    };

    recognition.onerror = () => {
        resetToIdle();
    };

    recognition.onend = () => {
        isListening = false;
    };

});
