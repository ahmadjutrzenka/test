"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TasteDNA extends Model {
    static associate(models) {
      TasteDNA.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
  }
  TasteDNA.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
        validate: {
          notNull: {
            msg: "User ID is required",
          },
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Taste DNA content is required",
          },
          notEmpty: {
            msg: "Taste DNA content cannot be empty",
          },
        },
      },
      generatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Generated date is required",
          },
          isDate: {
            msg: "Generated date must be a valid date",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "TasteDNA",
    },
  );
  return TasteDNA;
};
