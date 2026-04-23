const router = require("express").Router();

const AuthController = require("../controllers/AuthController");
const authentication = require("../middlewares/authentication");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google-login", AuthController.googleLogin);

router.use(authentication);
router.get("/profile", AuthController.getMyProfile);
router.patch("/profile", AuthController.updateMyProfile);
router.patch(
  "/profile/avatar",
  upload.single("avatar"),
  AuthController.updateMyAvatar,
);

module.exports = router;
