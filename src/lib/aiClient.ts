// Client AI helper with in-memory & localStorage caching

const DESC_CACHE_PREFIX = 'sh_ai_desc_';
const NEPALI_CACHE_PREFIX = 'sh_ai_nepali_';

export async function getAiDescription(dishName: string, dishDesc: string, category: string): Promise<string> {
  const cacheKey = DESC_CACHE_PREFIX + dishName;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('/api/ai/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dishName, dishDesc, category }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text) {
        localStorage.setItem(cacheKey, data.text);
        return data.text;
      }
    }
  } catch (e) {
    console.warn('AI describe request failed, using fallback:', e);
  }

  const fallback = `Sizzling hot and cooked fresh tonight: juicy ${dishName} packed with authentic Biratnagar spices!`;
  localStorage.setItem(cacheKey, fallback);
  return fallback;
}

export async function getAiComboSuggestion(
  cartItems: Array<{ name: string; qty: number }>,
  menuSummary: string[]
): Promise<string> {
  try {
    const res = await fetch('/api/ai/combo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems, menuSummary }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.suggestion) return data.suggestion;
    }
  } catch (e) {
    console.warn('AI combo request failed, using fallback:', e);
  }

  return `Chef recommends pairing your order with our piping-hot Chicken Steam Momo or crispy Mustang Aaloo!`;
}

export async function getAiNepaliTranslation(
  name: string,
  desc: string
): Promise<{ nepaliName: string; nepaliDesc: string }> {
  const cacheKey = NEPALI_CACHE_PREFIX + name;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch('/api/ai/nepali', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, desc }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.nepaliName) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn('AI nepali request failed, using fallback:', e);
  }

  const fallback = {
    nepaliName: name,
    nepaliDesc: `तातो र मिठो घरको स्वाद, विशेष बिरानगर शैलीमा तयार गरिएको।`,
  };
  localStorage.setItem(cacheKey, JSON.stringify(fallback));
  return fallback;
}

export async function sendAiChatMessage(
  message: string,
  menuContext: Array<{ name: string; price: number; cat: string }>
): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, menuContext }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch (e) {
    console.warn('AI chat request failed, using fallback:', e);
  }

  return `Namaste! We are Second Home Midnight Kitchen in Biratnagar-03, serving hot food until 3:00 AM. Try our Chicken Steam Momo or Biryani!`;
}
