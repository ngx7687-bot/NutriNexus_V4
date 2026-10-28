import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "25mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API endpoint for food image scanning and glycemic impact estimation
app.post("/api/scan", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", userContext } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const prompt = `Analyze this meal image for nutritional content and glycemic impact. 
    User context: ${JSON.stringify(userContext || {})}.
    Provide a detailed breakdown of each food item detected (name, portion_g, calories, carbs_g, fiber_g, sugar_g, protein_g, fat_g, estimated_gi).
    Calculate overall glycemic_load (sum of (GI * carbs) / 100 per food).
    Determine glycemic_impact as 'low' (<=10), 'medium' (11-19), or 'high' (>=20).
    Provide confidence (0.0 to 1.0) and helpful notes.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foods: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  portion_g: { type: Type.NUMBER },
                  calories: { type: Type.NUMBER },
                  carbs_g: { type: Type.NUMBER },
                  fiber_g: { type: Type.NUMBER },
                  sugar_g: { type: Type.NUMBER },
                  protein_g: { type: Type.NUMBER },
                  fat_g: { type: Type.NUMBER },
                  estimated_gi: { type: Type.NUMBER },
                },
                required: ["name", "portion_g", "calories", "carbs_g", "estimated_gi"],
              },
            },
            glycemic_load: { type: Type.NUMBER },
            glycemic_impact: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            notes: { type: Type.STRING },
          },
          required: ["foods", "glycemic_load", "glycemic_impact", "confidence"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from Gemini");
    }

    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Scan error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze meal image" });
  }
});

// API endpoint for generating a short practical nutritional tip
app.post("/api/tip", async (req, res) => {
  try {
    const { mealSummary, userHealth } = req.body;
    const prompt = `Based on this meal summary: ${JSON.stringify(mealSummary)} and user health conditions: ${JSON.stringify(userHealth || {})}, provide ONE short, practical, and encouraging nutritional tip or healthy food swap suggestion (max 2 sentences). Do not advise changing medication.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({ tip: response.text?.trim() || "Stay consistent with your nutrition and hydration goals today!" });
  } catch (error: any) {
    console.error("Tip error:", error);
    res.status(500).json({ error: error.message || "Failed to generate tip" });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NutriNexus server running on port ${PORT}`);
  });
}

startServer();
