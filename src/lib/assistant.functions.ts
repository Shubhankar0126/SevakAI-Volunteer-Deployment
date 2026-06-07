import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

const Input = z.object({
  question: z.string().min(1).max(2000),
  context: z.string().max(8000).optional(),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;

console.log("API Key Found:", !!apiKey);
console.log("Prefix:", apiKey?.substring(0, 6));

    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const systemPrompt = `
You are SevakAI Smart Volunteer Deployment Assistant.

You help with:
- Volunteer allocation
- Workforce optimization
- Zone staffing
- Emergency deployment
- Resource planning
- Crowd management

Rules:
1. Use only provided operational data.
2. Do not invent volunteers or incidents.
3. If information is unavailable, clearly say so.
4. Give practical recommendations.
`;

    const prompt = data.context
      ? `
Operational Data:
${data.context}

User Query:
${data.question}
`
      : data.question;

    const result = await model.generateContent(
      `${systemPrompt}\n\n${prompt}`
    );

    return {
      answer: result.response.text(),
    };
  });