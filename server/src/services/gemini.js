import { GoogleGenAI } from '@google/genai';

let _client = null;
function getClient() {
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _client;
}

function getModel() {
  return process.env.GEMINI_MODEL;
}

/**
 * Strip markdown code fences that some models insert despite being asked for
 * raw JSON.
 * @param {string} raw
 * @returns {string}
 */
function stripFences(raw) {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

/**
 * Validate that the parsed value is an array of 1–3 objects each with
 * non-empty substitute, ratio, and reason strings. Drops malformed items.
 * Throws if no valid items remain.
 * @param {unknown} parsed
 * @returns {{ substitute: string, ratio: string, reason: string }[]}
 */
function validateSuggestions(parsed) {
  if (!Array.isArray(parsed)) throw new Error('Response is not an array');
  const valid = parsed
    .slice(0, 3)
    .filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.substitute === 'string' && item.substitute.trim() &&
        typeof item.ratio === 'string' && item.ratio.trim() &&
        typeof item.reason === 'string' && item.reason.trim()
    )
    .map((item) => ({
      substitute: item.substitute.trim(),
      ratio: item.ratio.trim(),
      reason: item.reason.trim(),
    }));

  if (valid.length === 0) throw new Error('No valid suggestions in response');
  return valid;
}

/**
 * Call Gemini once and return validated suggestions array.
 * Throws on any failure.
 */
async function callGemini({ recipeTitle, ingredients, target, dietaryContext }) {
  const prompt = `You are a cooking assistant. A home cook is making "${recipeTitle}".
The recipe's ingredients are: ${ingredients.join(', ')}.
They cannot use or do not have: "${target}".
Dietary requirement: ${dietaryContext || 'none'}.

Suggest 2 to 3 substitutes for "${target}" that keep this dish working.
For each, give the substitute, the ratio to use (e.g. "1:1" or "3/4 cup per 1 cup"),
and a one-sentence reason it works in this specific recipe.
Respect the dietary requirement. Return only JSON, an array of objects with the keys
"substitute", "ratio", "reason". No markdown, no extra text.`;

  const client = getClient();
  const response = await client.models.generateContent({
    model: getModel(),
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const raw = response.text ?? '';
  const cleaned = stripFences(raw);
  const parsed = JSON.parse(cleaned);
  return validateSuggestions(parsed);
}

/**
 * Get 2–3 ingredient substitutes from Gemini. Retries once on failure.
 *
 * @param {{ recipeTitle: string, ingredients: string[], target: string, dietaryContext: string|null }} params
 * @returns {Promise<{ substitute: string, ratio: string, reason: string }[]>}
 */
export async function getSubstitutes(params) {
  try {
    return await callGemini(params);
  } catch (firstErr) {
    // Map Gemini rate-limit errors immediately — no point retrying
    const msg = firstErr.message ?? '';
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
      const err = new Error('AI is busy, try again in a minute.');
      err.status = 429;
      throw err;
    }

    console.warn('[gemini] First attempt failed, retrying once:', firstErr.message);
    try {
      return await callGemini(params);
    } catch (secondErr) {
      const msg2 = secondErr.message ?? '';
      if (msg2.includes('429') || msg2.toLowerCase().includes('quota') || msg2.toLowerCase().includes('rate')) {
        const err = new Error('AI is busy, try again in a minute.');
        err.status = 429;
        throw err;
      }
      const err = new Error('Could not generate substitutes, try again.');
      err.status = 502;
      throw err;
    }
  }
}
