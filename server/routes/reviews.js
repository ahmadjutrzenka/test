const router = require("express").Router();

const ReviewController = require("../controllers/ReviewController");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

// Public routes - on Dashboard
router.get("/recent", ReviewController.getRecentReviews);
router.get("/:id", ReviewController.getReviewById);

// Protected routes
router.post("/", authentication, ReviewController.createReview);
router.patch(
  "/:id",
  authentication,
  authorization,
  ReviewController.updateReview,
);
router.delete(
  "/:id",
  authentication,
  authorization,
  ReviewController.deleteReview,
);

module.exports = router;
