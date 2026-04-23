const { Review, User, Collection } = require("../models");
const {
  getDetailJikan,
  getDetailIGDB,
  searchJikanAnime,
  searchJikanManga,
  searchIGDB,
} = require("../helpers/externalApis");
const { Op } = require("sequelize");

class SearchController {
  static async getMediaDetails(req, res, next) {
    try {
      const { type, externalId } = req.params;

      if (!["anime", "manga", "game"].includes(type)) {
        throw {
          name: "BadRequest",
          message: "Type must be anime, manga, or game",
        };
      }

      let mediaInfo = null;
      if (type === "anime" || type === "manga") {
        mediaInfo = await getDetailJikan(externalId, type);
      } else {
        mediaInfo = await getDetailIGDB(externalId);
      }

      if (!mediaInfo) {
        throw {
          name: "NotFound",
          message: `${type} not found`,
        };
      }

      const collections = await Collection.findAll({
        where: {
          externalId: String(externalId),
          mediaType: type,
        },
        attributes: ["id"],
      });

      const collectionIds = collections.map((col) => col.id);

      let reviews = [];
      if (collectionIds.length > 0) {
        reviews = await Review.findAll({
          where: {
            collectionId: collectionIds,
          },
          include: [
            {
              model: User,
              attributes: ["id", "username", "avatar"],
            },
          ],
          order: [["updatedAt", "DESC"]],
        });
        reviews = reviews.map((review) => {
          const data = review.toJSON();
          data.isEdited =
            new Date(data.updatedAt).getTime() >
            new Date(data.createdAt).getTime() + 60000;
          return data;
        });
      }

      res.status(200).json({ mediaInfo, reviews });
    } catch (error) {
      next(error);
    }
  }

  static async unifiedSearch(req, res, next) {
    try {
      const { q, type = "all" } = req.query;

      if (!q) {
        throw {
          name: "BadRequest",
          message: "Query parameter 'q' is required",
        };
      }

      const validTypes = ["all", "anime", "manga", "game", "user"];
      if (!validTypes.includes(type)) {
        throw {
          name: "BadRequest",
          message: `Type must be all, anime, manga, game, or user`,
        };
      }

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const results = { anime: [], manga: [], game: [], users: [] };

      if (type === "all" || type === "user") {
        const users = await User.findAll({
          where: {
            username: { [Op.iLike]: `%${q}%` },
          },
          attributes: ["id", "username", "avatar"],
          limit: 10,
        });
        results.users = users;
      }

      if (type === "all" || type === "anime") {
        const animeData = await searchJikanAnime(q);
        results.anime = animeData.map((item) => ({
          externalId: String(item.mal_id),
          title: item.title,
          coverUrl: item.images?.jpg?.image_url || null,
          score: item.score || null,
          genres: item.genres?.map((g) => g.name) || [],
          synopsis: item.synopsis || null,
          mediaType: "anime",
        }));
        if (type === "all") await delay(500);
      }

      if (type === "all" || type === "manga") {
        const mangaData = await searchJikanManga(q);
        results.manga = mangaData.map((item) => ({
          externalId: String(item.mal_id),
          title: item.title,
          coverUrl: item.images?.jpg?.image_url || null,
          score: item.score || null,
          genres: item.genres?.map((g) => g.name) || [],
          synopsis: item.synopsis || null,
          mediaType: "manga",
        }));
        if (type === "all") await delay(500);
      }

      if (type === "all" || type === "game") {
        const gameData = await searchIGDB(q);
        results.game = gameData.map((item) => {
          const rawCover = item.cover?.url || null;
          return {
            externalId: String(item.id),
            title: item.name,
            coverUrl: rawCover
              ? "https:" + rawCover.replace("t_thumb", "t_cover_big")
              : null,
            score: item.rating ? Math.round(item.rating) / 10 : null,
            genres: item.genres?.map((g) => g.name) || [],
            synopsis: item.summary || null,
            mediaType: "game",
          };
        });
      }

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  static async getDetail(req, res, next) {
    try {
      const { id, type } = req.query;

      if (!id) {
        throw {
          name: "BadRequest",
          message: "id is required",
        };
      }
      if (!type) {
        throw {
          name: "BadRequest",
          message: "type is required",
        };
      }
      if (!["anime", "manga", "game"].includes(type)) {
        throw {
          name: "BadRequest",
          message: "Type must be anime, manga, or game",
        };
      }

      let detail = null;

      if (type === "anime" || type === "manga") {
        const raw = await getDetailJikan(id, type);

        if (!raw) {
          throw {
            name: "NotFound",
            message: `${type} not found`,
          };
        }

        detail = {
          externalId: String(raw.mal_id),
          title: raw.title,
          coverUrl: raw.images?.jpg?.image_url || null,
          score: raw.score || null,
          genres: raw.genres?.map((g) => g.name) || [],
          synopsis: raw.synopsis || null,
          status: raw.status || null,
          mediaType: type,

          episodes: raw.episodes || null,
          chapters: raw.chapters || null,
        };
      } else {
        const raw = await getDetailIGDB(id);
        if (!raw) {
          throw {
            name: "NotFound",
            message: `game not found`,
          };
        }
        const rawCover = raw.cover?.url || null;
        detail = {
          externalId: String(raw.id),
          title: raw.name,
          coverUrl: rawCover
            ? "https:" + rawCover.replace("t_thumb", "t_cover_big")
            : null,
          score: raw.rating ? Math.round(raw.rating) / 10 : null,
          genres: raw.genres?.map((g) => g.name) || [],
          synopsis: raw.summary || null,
          developers:
            raw.involved_companies
              ?.map((c) => c.company?.name)
              .filter(Boolean) || [],
          mediaType: "game",
        };
      }

      res.status(200).json(detail);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SearchController;
