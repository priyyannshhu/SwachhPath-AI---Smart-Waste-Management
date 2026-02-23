import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

/**
 * POST /api/ai/analyze
 * Secure backend endpoint for Gemini AI analysis
 * 
 * Frontend never sees the API key (stays on server)
 * Request body: { prompt: string }
 * Response: { insights: string }
 */
app.post("/api/ai/analyze", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    
    if (!body || !body.prompt || typeof body.prompt !== "string") {
      return c.json({ error: "Invalid prompt: must provide a non-empty string" }, 400);
    }

    const prompt = body.prompt.trim();

    // Get API key from environment (kept secure on server)
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || c.env?.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY not configured in environment");
      return c.json({ 
        error: "AI service not configured",
        details: "API key not found. Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY environment variable."
      }, 500);
    }

    console.log("Calling Gemini API with prompt length:", prompt.length);

    // Call Google Generative AI API (Gemini)
    // API key must be passed as query parameter
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("Gemini API error status:", response.status);
      console.error("Gemini API error response:", responseText);
      return c.json(
        { 
          error: "AI analysis failed", 
          details: `Status ${response.status}: ${responseText.substring(0, 200)}`
        },
        response.status
      );
    }

    // Parse response safely
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText.substring(0, 200));
      return c.json(
        { 
          error: "Invalid response format from AI service",
          details: "Response body is not valid JSON"
        },
        500
      );
    }
    
    // Extract text from Gemini response
    const insights =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.result?.text ||
      "Unable to generate insights from the provided data. Please try again.";

    console.log("Gemini API success, insights length:", insights.length);

    return c.json({ insights });
  } catch (error) {
    console.error("Analyze endpoint error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json(
      { 
        error: "Internal server error", 
        details: errorMessage 
      },
      500
    );
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
