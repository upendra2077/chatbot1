import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const MODEL_NAME = "gemini-3.8-flash"; // change if this model isn't available for your key

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("API key not found. Check your .env file (GEMINI_API_KEY=yourkey).");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const systemPrompt = `
You are a friendly College Help assistant for students.
Answer general questions about college life, courses, and admissions in simple English.
If you are unsure, say sorry instead of inventing an answer.
`;

const app = express();
app.use(express.json());
app.use(express.static("public"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry when Google's server is busy (503) or rate-limited (429)
async function generateWithRetry(message, retries = 4) {
  let delay = 2000;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: message,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.5,
          maxOutputTokens: 2000,
        },
      });
    } catch (error) {
      const text = String(error?.message || error);
      const temporary =
        text.includes("503") || text.includes("UNAVAILABLE") || text.includes("429");
      if (temporary && attempt < retries - 1) {
        console.log(`Server busy, retrying in ${delay / 1000}s...`);
        await sleep(delay);
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
}

app.post("/chat", async (req, res) => {
  const message = (req.body?.message || "").trim();

  if (!message) {
    return res.status(400).json({ error: "Please enter a question." });
  }

  try {
    const response = await generateWithRetry(message);
    const reply = response.text || "No text response was returned.";
    res.json({ reply });
  } catch (error) {
    console.error("AI request failed:", error.message);
    console.error("Cause:", error.cause); // shows the real network reason
    res.status(500).json({ error: "AI request failed. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
