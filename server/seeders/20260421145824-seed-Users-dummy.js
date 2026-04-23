"use strict";

const { hashPassword } = require("../helpers/bcrypt");

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          username: "haseulbintaro",
          email: "haseul@mail.com",
          password: hashPassword("haseul123"),
          loginMethod: "local",
          avatar:
            "https://pbs.twimg.com/media/G_Sez5ZW4AATq7z?format=jpg&name=large",
          bio: "Local dummy user 1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "sohyunslipi",
          email: "sohyun@mail.com",
          password: hashPassword("sohyun123"),
          loginMethod: "local",
          avatar:
            "https://pbs.twimg.com/media/HGR-_iFbkAAMDOP?format=jpg&name=large",
          bio: "Local dummy user 2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Users",
      {
        email: ["haseul@mail.com", "sohyun@mail.com"],
      },
      {},
    );
  },
};
