const router = require("express").Router();

const SearchController = require("../controllers/SearchController");

router.get("/:type/:externalId", SearchController.getMediaDetails);

module.exports = router;
