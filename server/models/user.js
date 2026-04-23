"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Collection, {
        foreignKey: "userId",
      });
      User.hasMany(models.Review, {
        foreignKey: "userId",
      });
      User.hasOne(models.TasteDNA, {
        foreignKey: "userId",
      });
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: "Username cannot be empty",
          },
          notNull: {
            msg: "Username is required",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: "Must be a valid email address",
          },
          notEmpty: {
            msg: "Email cannot be empty",
          },
          notNull: {
            msg: "Email is required",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [6, 100],
            msg: "Password must be at least 6 characters long",
          },
        },
      },
      loginMethod: {
        type: DataTypes.ENUM("local", "google"),
        allowNull: false,
        validate: {
          notNull: {
            msg: "Login method is required",
          },
          isIn: {
            args: [["local", "google"]],
            msg: "Login method must be either 'local' or 'google'",
          },
        },
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
    },
  );
  User.beforeCreate((user) => {
    const { hashPassword } = require("../helpers/bcrypt");
    if (user.password) {
      user.password = hashPassword(user.password);
    }
  });
  return User;
};
