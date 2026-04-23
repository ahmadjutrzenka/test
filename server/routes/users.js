const router = require("express").Router();

const UserController = require("../controllers/UserController");

router.get("/", UserController.getUsers);
router.get("/:username", UserController.getPublicProfile);

module.exports = router;
