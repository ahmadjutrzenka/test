const router = require("express").Router();

const CollectionController = require("../controllers/CollectionController");
const authorization = require("../middlewares/authorization");

router.get("/", CollectionController.getMyCollections);
router.post("/", CollectionController.addCollection);
router.get("/:id", authorization, CollectionController.getCollectionById);
router.patch("/:id", authorization, CollectionController.updateCollection);
router.delete("/:id", authorization, CollectionController.deleteCollection);

module.exports = router;
