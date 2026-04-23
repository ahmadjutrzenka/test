const { Review, User, Collection } = require("../models");

class ReviewController {
  static async getRecentReviews(req, res, next) {
    try {
      const reviews = await Review.findAll({
        order: [["updatedAt", "DESC"]],
        limit: 20,
        include: [
          {
            model: User,
            attributes: ["id", "username", "avatar"],
          },
          {
            model: Collection,
            attributes: ["id", "title", "coverUrl", "mediaType", "externalId"],
          },
        ],
      });

      const result = reviews.map((review) => {
        const data = review.toJSON();
        data.isEdited =
          new Date(data.updatedAt).getTime() >
          new Date(data.createdAt).getTime();
        return data;
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getReviewById(req, res, next) {
    try {
      const { id } = req.params;

      const review = await Review.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ["id", "username", "avatar"],
          },
          {
            model: Collection,
            attributes: ["id", "title", "coverUrl", "mediaType", "externalId"],
          },
        ],
      });

      if (!review) {
        throw { name: "NotFound", message: "Review not found" };
      }

      const data = review.toJSON();
      data.isEdited =
        new Date(data.updatedAt).getTime() > new Date(data.createdAt).getTime();

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async createReview(req, res, next) {
    try {
      const { collectionId, rating, content } = req.body;
      const userId = req.user.id;

      if (!rating && !content) {
        throw {
          name: "BadRequest",
          message: "Rating or review content is required",
        };
      }

      const collection = await Collection.findByPk(collectionId);
      if (!collection) {
        throw { name: "NotFound", message: "Collection item not found" };
      }
      if (collection.userId !== userId) {
        throw {
          name: "Forbidden",
          message: "You can only review your own collection items",
        };
      }

      const review = await Review.create({
        userId,
        collectionId,
        rating,
        content,
      });

      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  static async updateReview(req, res, next) {
    try {
      const { id } = req.params;
      const { rating, content } = req.body;

      const review = await Review.findByPk(id);
      if (!review) {
        throw { name: "NotFound", message: "Review not found" };
      }

      await review.update({ rating, content });

      const data = review.toJSON();
      data.isEdited =
        new Date(data.updatedAt).getTime() > new Date(data.createdAt).getTime();

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async deleteReview(req, res, next) {
    try {
      const { id } = req.params;

      const review = await Review.findByPk(id);
      if (!review) {
        throw { name: "NotFound", message: "Review not found" };
      }

      await review.destroy();

      res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;
