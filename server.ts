import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `You are the Second Home chef assistant in Biratnagar-03, Nepal.
Tagline: "Good Food Feels Like Home".
Operating hours: 6:00 PM to 3:00 AM daily. Delivery in insulated thermal foil packing (avg 24 min).
Be warm, concise (≤2 sentences), Nepali-friendly (use words like mitho, namaste, jhol, tatotato).
Only recommend dishes that actually exist in the provided menu items.`;

// 1. AI Describe Endpoint: one-sentence mouth-watering description
app.post('/api/ai/describe', async (req: Request, res: Response) => {
  const { dishName, dishDesc, category } = req.body;

  if (!dishName) {
    return res.status(400).json({ error: 'dishName is required' });
  }

  if (!ai) {
    // Intelligent local fallback
    return res.json({
      text: `Sizzling hot and made fresh tonight in Biratnagar: juicy ${dishName} packed with authentic spices and delivered piping hot in insulated foil!`,
    });
  }

  try {
    const prompt = `Write a single, mouth-watering sentence (under 25 words) describing this dish for midnight delivery customers in Biratnagar, Nepal:
Dish: "${dishName}"
Category: "${category || 'Nepali Special'}"
Description: "${dishDesc || ''}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text?.trim() || `Freshly prepared ${dishName}, delivered steaming hot in insulated foil.`;
    return res.json({ text });
  } catch (error) {
    console.error('Error generating description:', error);
    return res.json({
      text: `Delicious homestyle ${dishName} cooked fresh to order and delivered piping hot to your doorstep!`,
    });
  }
});

// 2. AI Combo Suggestion: suggest complementary dishes based on cart
app.post('/api/ai/combo', async (req: Request, res: Response) => {
  const { cartItems, menuSummary } = req.body;

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'cartItems array is required' });
  }

  const itemNames = cartItems.map((i: { name: string }) => i.name).join(', ');

  if (!ai) {
    return res.json({
      suggestion: `Pair your ${cartItems[0]?.name || 'order'} with our bestseller Chicken Steam Momo and a hot bowl of Chicken Thukpa for the ultimate late-night feast!`,
    });
  }

  try {
    const prompt = `The customer currently has these items in their midnight cart: [${itemNames}].
Available menu items to suggest from: ${JSON.stringify(menuSummary || ['Chicken Steam Momo', 'Chicken Fried Rice', 'Aloo Paratha Ghee', 'Chicken Chilly', 'Dal Fry', 'Dragon Chicken'])}.
Suggest 1 or 2 complementary items from the menu to complete their meal. Keep it warm, appetizing, and strictly within 2 short sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const suggestion = response.text?.trim() || `We recommend adding our hot Chicken Steam Momo or Crispy Dragon Chicken to complete your midnight meal!`;
    return res.json({ suggestion });
  } catch (error) {
    console.error('Error suggesting combo:', error);
    return res.json({
      suggestion: `Enhance your feast with our signature Chicken Steam Momo or sizzling Chicken Fried Rice!`,
    });
  }
});

// 3. AI Nepali Translation: name and description in Nepali
app.post('/api/ai/nepali', async (req: Request, res: Response) => {
  const { name, desc } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  if (!ai) {
    return res.json({
      nepaliName: name,
      nepaliDesc: `तातो र मिठो घरको स्वाद, विशेष बिरानगर शैलीमा तयार गरिएको।`,
    });
  }

  try {
    const prompt = `Translate this dish name and description into natural, appetizing Nepali (Devanagari script):
English Name: "${name}"
English Description: "${desc || ''}"

Return valid JSON with keys: "nepaliName" and "nepaliDesc".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You translate food menus into natural Devanagari Nepali. Return JSON with nepaliName and nepaliDesc.',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      nepaliName: parsed.nepaliName || name,
      nepaliDesc: parsed.nepaliDesc || desc,
    });
  } catch (error) {
    console.error('Error translating to Nepali:', error);
    return res.json({
      nepaliName: name,
      nepaliDesc: `तातो र ताजा बिरानगरको स्वादिलो परिकार।`,
    });
  }
});

// 4. AI Chat: Ask about the menu
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { message, history, menuContext } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!ai) {
    return res.json({
      reply: `Namaste! We are Second Home Midnight Kitchen in Biratnagar-03, open 6:00 PM to 3:00 AM daily. Try our signature Chicken Steam Momo, Biryani, or Kadhai Chicken! You can also call us at +977-9761341498.`,
    });
  }

  try {
    const contextPrompt = `Menu summary: ${JSON.stringify(menuContext || []).slice(0, 3000)}
Customer inquiry: "${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const reply = response.text?.trim() || `Namaste! Our kitchen is ready with hot momos, curries, and biryani. How can we make your night delicious?`;
    return res.json({ reply });
  } catch (error) {
    console.error('Error in chat:', error);
    return res.json({
      reply: `Namaste! We are open 6:00 PM to 3:00 AM in Biratnagar. Our chef recommends the Chicken Steam Momo and Chicken Biryani!`,
    });
  }
});

// Server setup for Vite development or static production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Vite middleware in dev
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌙 Second Home Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
