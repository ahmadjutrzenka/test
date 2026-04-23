const router = require("express").Router();

const SearchController = require("../controllers/SearchController");

router.get("/popular", SearchController.getPopular);
router.get("/", SearchController.unifiedSearch);
router.get("/detail", SearchController.getDetail);

module.exports = router;
