const router = require("express").Router();
const authentication = require("../middlewares/authentication");

const authRouter = require("./auth");
const usersRouter = require("./users");
const collectionsRouter = require("./collections");
const reviewsRouter = require("./reviews");
const searchRouter = require("./search");
const mediaRouter = require("./media");
const aiRouter = require("./ai");

// Public routes
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/reviews", reviewsRouter);
router.use("/media", mediaRouter);

// Protected routes
router.use(authentication);
router.use("/collections", collectionsRouter);
router.use("/search", searchRouter);
router.use("/ai", aiRouter);

module.exports = router;
