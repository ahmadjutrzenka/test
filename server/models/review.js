"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Review.belongsTo(models.Collection, {
        foreignKey: "collectionId",
      });
    }
  }
  Review.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      collectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "Collections",
          key: "id",
        },
        onDelete: "CASCADE",
        validate: {
          notNull: {
            msg: "Collection ID is required",
          },
        },
      },
      rating: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          min: {
            args: [0.5],
            msg: "Rating must be at least 0.5",
          },
          max: {
            args: [10],
            msg: "Rating cannot exceed 10",
          },
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Review",
    },
  );
  return Review;
};
