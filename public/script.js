document.addEventListener("DOMContentLoaded", () => {

    const micButton = document.getElementById("micButton");
    const statusText = document.getElementById("statusText");

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    function setState(state) {
        statusText.innerText = state;
    }

    micButton.addEventListener("click", () => {
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
                setState("Idle");
                alert(data.message || "Could not detect date.");
            }

        } catch (error) {
            console.error(error);
            setState("Idle");
        }
    };

    recognition.onerror = () => {
        setState("Idle");
    };

});
