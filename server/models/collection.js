"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    static associate(models) {
      Collection.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Collection.hasOne(models.Review, {
        foreignKey: "collectionId",
      });
    }
  }
  Collection.init(
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
          notNull: { msg: "User ID is required" },
        },
      },
      mediaType: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: ["anime", "manga", "game"],
        validate: {
          notNull: { msg: "Media type is required" },
          isIn: {
            args: [["anime", "manga", "game"]],
            msg: "Media type must be one of: anime, manga, game",
          },
        },
      },
      externalId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "External ID is required" },
          notEmpty: { msg: "External ID cannot be empty" },
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Title is required" },
          notEmpty: { msg: "Title cannot be empty" },
        },
      },
      coverUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      genres: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      synopsis: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      score: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["plan", "ongoing", "completed", "dropped"],
        allowNull: false,
        validate: {
          notNull: { msg: "Status is required" },
          isIn: {
            args: [["plan", "ongoing", "completed", "dropped"]],
            msg: "Status must be one of: plan, ongoing, completed, dropped",
          },
        },
      },
      isFavorite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Collection",
      // Unique constraint: 1 user tidak bisa punya media yang sama 2x
      indexes: [
        {
          unique: true,
          fields: ["userId", "externalId", "mediaType"],
          name: "unique_user_media",
        },
      ],
    },
  );
  return Collection;
};
