const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("questionInput");
const chatBox = document.getElementById("chatBox");

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) return;

  const questionLine = document.createElement("p");
  questionLine.className = "question";
  questionLine.textContent = "You: " + question;
  chatBox.appendChild(questionLine);

  const statusLine = document.createElement("p");
  statusLine.textContent = "Gemini is thinking...";
  chatBox.appendChild(statusLine);

  questionInput.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await response.json();
    statusLine.remove();

    if (!response.ok) throw new Error(data.error || "Request failed.");

    const answerLine = document.createElement("p");
    answerLine.className = "answer";
    answerLine.textContent = "AI: " + data.answer;
    chatBox.appendChild(answerLine);
  } catch (error) {
    statusLine.textContent = "Error: " + error.message;
  }
});
