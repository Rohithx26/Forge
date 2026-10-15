import { handleFoodRequest } from '../../server/food.js';

export default (req: Request) =>
  handleFoodRequest(req, { apiKey: process.env.GEMINI_API_KEY, projectId: process.env.VITE_FIREBASE_PROJECT_ID });

export const config = { path: '/api/food' };
