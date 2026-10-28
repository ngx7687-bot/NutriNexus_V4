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

const clinicalNutritionistSystemInstruction = "You are an expert clinical nutritionist and AI vision assistant for NutriNexus, a health and wellness app focused on blood sugar management and dietary tracking. When a user uploads an image of a meal (such as Nasi Lemak, chicken rice, or local dishes), analyze the food items visible in the image. You MUST return your response strictly as a valid JSON object matching the requested schema.";

// API endpoint for food image scanning and glycemic impact estimation
app.post(["/api/scan", "/api/analyze-meal"], async (req, res) => {
  try {
    const { image, imageBase64, mimeType = "image/jpeg", userContext } = req.body;
    const base64Data = imageBase64 || (image ? image.split(',')[1] : null);
    if (!base64Data) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const prompt = `Analyze this meal image for nutritional content, ingredients, and glycemic impact. 
    User context: ${JSON.stringify(userContext || {})}.
    Provide mealName, calories, protein, fiber, carbs, fats, ingredients list, and healthTip.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        systemInstruction: clinicalNutritionistSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mealName: { type: Type.STRING, description: "Name of the dish (e.g., Traditional Nasi Lemak)" },
            calories: { type: Type.NUMBER, description: "Estimated total calories in kcal" },
            protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
            fiber: { type: Type.NUMBER, description: "Estimated dietary fiber in grams" },
            carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
            fats: { type: Type.NUMBER, description: "Estimated fats in grams" },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of identified ingredients"
            },
            healthTip: { type: Type.STRING, description: "A brief clinical or dietary tip regarding this meal, especially considering glycemic impact." }
          },
          required: ["mealName", "calories", "protein", "fiber", "carbs", "fats", "ingredients", "healthTip"],
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
    console.error("Scan/Analyze error:", error);
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
      config: {
        systemInstruction: clinicalNutritionistSystemInstruction,
      }
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
