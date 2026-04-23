const router = require("express").Router();

const AIController = require("../controllers/aiController");

router.post("/vibe-match", AIController.vibeMatch);
router.post("/title-match", AIController.titleMatch);
router.post("/taste-dna", AIController.generateTasteDNA);

module.exports = router;
