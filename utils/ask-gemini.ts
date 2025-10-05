"use server";

import { generatePrompt } from "@/utils/prompt-gemini";

type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }> | null;
};

type GeminiCVAnalysisResponse = {
  text: string;
};


const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const getGeminiScore = async (
  prompt: string
): Promise<
  | { success: true; response: GeminiCVAnalysisResponse }
  | { success: false; message: string }
> => {
  if (!GEMINI_API_KEY) {
    return { success: false, message: "GEMINI_API_KEY is not set." };
  }

  try {
    const fullPrompt = generatePrompt(prompt);

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4048,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch response from Gemini: ${response.status}`,
      };
    }

    const data = (await response.json()) as GeminiResponse;

    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

    if (!responseText) {
      return { success: false, message: "No text found in the response." };
    }

    // JSON
    // const match = responseText.match(/{[\s\S]*}/);
    // if (!match) {
    //   return {
    //     success: false,
    //     message: "No valid JSON found in the response.",
    //   };
    // }

    // const jsonResponse = JSON.parse(match[0]) as GeminiCVAnalysisResponse;

    return {
      success: true,
      response: {
        text: responseText,
      },
    };
  } catch (error: unknown) {
    console.error("Failed to get Gemini response:", error);
    return {
      success: false,
      message: "An error occurred while fetching the response.",
    };
  }
};
