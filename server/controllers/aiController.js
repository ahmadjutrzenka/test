const { Collection, TasteDNA } = require("../models");
const { generateContent, parseGeminiJSON } = require("../helpers/gemini");
const { enrichAIResults } = require("../helpers/externalApis");

function buildVibePrompt(references, targetTypes, excludeTitles) {
  const refText = references
    .map(
      (r) => `
- Title: ${r.title} (${r.mediaType})
  Genres: ${(r.genres || []).join(", ") || "N/A"}
  Synopsis: ${(r.synopsis || "").slice(0, 250) || "N/A"}
  Score: ${r.score || "N/A"}
  Status: ${r.status}`,
    )
    .join("");

  const excludeText =
    excludeTitles && excludeTitles.length
      ? `Do NOT recommend: ${excludeTitles.join(", ")}.`
      : "";

  return `You are a cross-media recommendation engine for anime, manga, and games.

Analyze these reference titles from the user's collection:
${refText}

Identify the dominant vibe, tone, themes, and taste patterns.
Recommend titles for: ${targetTypes.join(", ")}. Maximum 3 per category.
${excludeText}
Consider: same creator/studio, media adaptations, demographic, emotional register, pacing, and setting.

Respond with ONLY valid JSON, no markdown, no extra text:
{
  "anime": [{"title": "...", "reason": "1-2 sentence specific reason"}],
  "manga": [{"title": "...", "reason": "..."}],
  "game": [{"title": "...", "reason": "..."}]
}
Keys not requested → empty array [].`;
}

class AIController {
  static async vibeMatch(req, res, next) {
    try {
      const { referenceIds, targetMediaTypes, excludeTitles = [] } = req.body;

      if (
        !referenceIds ||
        !Array.isArray(referenceIds) ||
        referenceIds.length === 0
      ) {
        throw {
          name: "BadRequest",
          message: "referenceIds must be a non-empty array.",
        };
      }
      if (
        !targetMediaTypes ||
        !Array.isArray(targetMediaTypes) ||
        targetMediaTypes.length === 0
      ) {
        throw {
          name: "BadRequest",
          message: "targetMediaTypes must be a non-empty array.",
        };
      }

      const references = await Collection.findAll({
        where: { id: referenceIds, userId: req.user.id },
      });

      if (references.length === 0) {
        throw {
          name: "NotFound",
          message: "No valid reference titles found in your collection.",
        };
      }

      const prompt = buildVibePrompt(references, targetMediaTypes, excludeTitles);
      const text = await generateContent(prompt);

      const parsed = parseGeminiJSON(text);
      const filtered = {};
      for (const type of targetMediaTypes) {
        filtered[type] = parsed[type] || [];
      }
      const enriched = await enrichAIResults(filtered);

      res.status(200).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  static async titleMatch(req, res, next) {
    try {
      const { collectionId, excludeTitles = [] } = req.body;

      if (!collectionId) {
        throw {
          name: "BadRequest",
          message: "collectionId is required.",
        };
      }

      const reference = await Collection.findOne({
        where: { id: collectionId, userId: req.user.id },
      });

      if (!reference) {
        throw {
          name: "NotFound",
          message: "Collection not found.",
        };
      }

      const targetTypes = ["anime", "manga", "game"];
      const prompt = buildVibePrompt([reference], targetTypes, excludeTitles);
      const text = await generateContent(prompt);

      const parsed = parseGeminiJSON(text);
      const enriched = await enrichAIResults(parsed);

      res.status(200).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  static async generateTasteDNA(req, res, next) {
    try {
      const collections = await Collection.findAll({
        where: { userId: req.user.id },
      });

      if (collections.length === 0) {
        throw {
          name: "BadRequest",
          message:
            "Add some titles to your collection first before generating your Taste DNA.",
        };
      }

      const collectionText = collections
        .map(
          (c) => `
- ${c.title} (${c.mediaType}) | Genres: ${(c.genres || []).join(", ") || "N/A"} | Score: ${c.score || "N/A"} | Status: ${c.status}`,
        )
        .join("");

      const prompt = `You are an expert in media taste analysis.

Based on this user's collection across anime, manga, and games:
${collectionText}

Write a 2-3 paragraph personal taste profile in English. Be specific, evocative, and personal — like a music journalist describing an artist's sound. Reference actual patterns you see in their collection (genres, themes, tone). Do NOT list the titles directly. Do NOT use bullet points. Write in flowing prose.`;

      const text = await generateContent(prompt);
      const content = text.trim();
      const generatedAt = new Date();

      const [tasteDNA] = await TasteDNA.findOrCreate({
        where: { userId: req.user.id },
        defaults: { content, generatedAt },
      });

      if (tasteDNA.content !== content) {
        await tasteDNA.update({ content, generatedAt });
      }

      res.status(200).json({
        content: tasteDNA.content,
        generatedAt: tasteDNA.generatedAt,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AIController;