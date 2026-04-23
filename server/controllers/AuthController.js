const { User, TasteDNA } = require("../models");
const { comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { OAuth2Client } = require("google-auth-library");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser && existingUser.loginMethod === "google") {
        throw {
          name: "BadRequest",
          message:
            "Email already registered via Google. Please sign in with Google.",
        };
      }

      const user = await User.create({
        username,
        email,
        password,
        loginMethod: "local",
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        loginMethod: user.loginMethod,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) {
        throw { name: "BadRequest", message: "Email is required" };
      }
      if (!password) {
        throw { name: "BadRequest", message: "Password is required" };
      }

      const user = await User.findOne({
        where: {
          email,
        },
      });

      if (!user) {
        throw { name: "Unauthorized", message: "Invalid email or password" };
      }

      if (user.loginMethod === "google") {
        throw {
          name: "Unauthorized",
          message:
            "This account uses Google sign-in. Please sign in with Google.",
        };
      }

      const checkPassword = comparePassword(password, user.password);

      if (!checkPassword) {
        throw { name: "Unauthorized", message: "Invalid email or password" };
      }

      const access_token = signToken({
        id: user.id,
        email: user.email,
      });
      res.status(200).json({
        access_token: access_token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      const { access_token_google } = req.headers;

      if (!access_token_google) {
        throw { name: "BadRequest", message: "Google token is required" };
      }

      const ticket = await client.verifyIdToken({
        idToken: access_token_google,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload.email_verified) {
        throw { name: "BadRequest", message: "Google email is not verified" };
      }

      const [user] = await User.findOrCreate({
        where: { email: payload.email },
        defaults: {
          username: payload.name || payload.email.split("@")[0],
          password: Date.now().toString() + Math.random().toString(),
          loginMethod: "google",
          avatar: payload.picture || null,
        },
      });

      const access_token = signToken({
        id: user.id,
        email: user.email,
      });

      res.status(200).json({ access_token });
    } catch (error) {
      next(error);
    }
  }

  static async getMyProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: require("../models").TasteDNA,
            as: "TasteDNA",
            attributes: ["content", "generatedAt"],
          },
        ],
      });

      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyProfile(req, res, next) {
    try {
      const { bio } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      await user.update({ bio });
      res.status(200).json({
        message: "Profile updated successfully",
        bio: user.bio,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyAvatar(req, res, next) {
    try {
      if (!req.file) {
        throw { name: "BadRequest", message: "Avatar image is required" };
      }

      const base64Image = req.file.buffer.toString("base64");
      const base64DataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      const result = await cloudinary.uploader.upload(base64DataUrl, {
        folder: "questivate/avatars",
        public_id: `user_${req.user.id}`,
        overwrite: true,
      });

      const user = await User.findByPk(req.user.id);
      await user.update({ avatar: result.secure_url });

      res.status(200).json({
        message: "Avatar updated successfully",
        avatar: result.secure_url,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
