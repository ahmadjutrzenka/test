const { Collection, Review } = require("../models");

const authorization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const isReviewRoute = req.baseUrl.endsWith("/reviews");

    if (isReviewRoute) {
      const review = await Review.findByPk(id);

      if (!review) {
        throw { name: "NotFound", message: "Review not found" };
      }
      if (review.userId !== userId) {
        throw { name: "Forbidden", message: "You are not authorized" };
      }
    } else {
      const collection = await Collection.findByPk(id);

      if (!collection) {
        throw { name: "NotFound", message: "Collection not found" };
      }
      if (collection.userId !== userId) {
        throw { name: "Forbidden", message: "You are not authorized" };
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authorization;
