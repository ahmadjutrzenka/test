const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

const authentication = async (req, res, next) => {
  try {
    //Bearer dari authorization headers
    const { authorization } = req.headers;

    if (!authorization) {
      //kalau dia ga bawa bearer token
      throw { name: "Unauthorized", message: "Invalid Token" };
    }

    //split bearer
    const rawToken = authorization.split(" ");
    const tokenType = rawToken[0]; //bearer
    const tokenValue = rawToken[1]; //token

    if (tokenType !== "Bearer" || !tokenValue) {
      throw { name: "Unauthorized", message: "Invalid Token" };
    }

    // verify pakai helpers JWT
    const payload = verifyToken(tokenValue); //jadi payload
    // console.log(payload);

    //double check lagi ambil dari userController ganti where email jadi id
    const user = await User.findOne({
      where: {
        id: payload.id, //dari payload habis verify
      },
    });

    if (!user) {
      throw { name: "Unauthorized", message: "Invalid Token" };
    }

    req.user = {
      id: user.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authentication;
