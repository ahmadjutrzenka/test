const { User, Collection, Review, TasteDNA } = require("../models");
const { Op } = require("sequelize");

class UserController {
  static async getUsers(req, res, next) {
    try {
      const keyword = req.query.q ?? req.query.query;
      const where = {};
      if (keyword) {
        where.username = {
          [Op.iLike]: `%${keyword}%`,
        };
      }
      const users = await User.findAll({
        where,
        attributes: ["id", "username", "avatar"],
        limit: 20,
      });

      res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicProfile(req, res, next) {
    try {
      const { username } = req.params;

      const user = await User.findOne({
        where: { username },
        attributes: ["id", "username", "avatar", "bio", "createdAt"],
      });
      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      const collections = await Collection.findAll({
        where: { userId: user.id },
        include: [
          {
            model: Review,
            required: false,
            attributes: ["id", "rating", "content", "createdAt", "updatedAt"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const favorites = await Collection.findAll({
        where: { userId: user.id, isFavorite: true },
        attributes: [
          "id",
          "title",
          "coverUrl",
          "mediaType",
          "externalId",
          "isFavorite",
        ],
        limit: 5,
      });

      const tasteDNA = await TasteDNA.findOne({
        where: { userId: user.id },
        attributes: ["content", "generatedAt"],
      });

      const stats = {
        anime: collections.filter((c) => c.mediaType === "anime").length,
        manga: collections.filter((c) => c.mediaType === "manga").length,
        game: collections.filter((c) => c.mediaType === "game").length,
      };

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          joinedSince: user.createdAt,
        },
        stats,
        favorites,
        tasteDNA,
        collections,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
