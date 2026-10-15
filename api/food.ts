import { handleFoodRequest } from '../server/food.js';

export function POST(req: Request) {
  return handleFoodRequest(req, { apiKey: process.env.GEMINI_API_KEY, groqKey: process.env.GROQ_API_KEY, projectId: process.env.VITE_FIREBASE_PROJECT_ID });
}
