const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();
const {
  registerUser,
  loginUser,
  getUser,
  changeAvatar,
  getAuthors,
  editUser,
} = require("../controller/UserController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", getUser);
router.get("/", getAuthors);
router.post("/change-avatar", authMiddleware, changeAvatar);
router.patch("/edit-user", authMiddleware, editUser);

module.exports = router;
