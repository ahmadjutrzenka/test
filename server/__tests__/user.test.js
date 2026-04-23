const request = require("supertest");
const app = require("../app");
const { sequelize, User, Collection, Review, TasteDNA } = require("../models");
const { signToken } = require("../helpers/jwt");

let userA, userB, colAnime, colManga;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  userA = await User.create({
    username: "publicUser",
    email: "pub@mail.com",
    password: "pass123",
    loginMethod: "local",
    bio: "I love anime and games",
  });

  userB = await User.create({
    username: "searchTarget",
    email: "target@mail.com",
    password: "pass123",
    loginMethod: "local",
    bio: "Another user",
  });

  // Buat koleksi untuk userB agar stats bisa diuji
  colAnime = await Collection.create({
    userId: userB.id,
    mediaType: "anime",
    externalId: "1535",
    title: "Death Note",
    status: "completed",
    isFavorite: true,
  });

  colManga = await Collection.create({
    userId: userB.id,
    mediaType: "manga",
    externalId: "25",
    title: "Fullmetal Alchemist",
    status: "ongoing",
    isFavorite: false,
  });

  // Buat review untuk koleksi userB
  await Review.create({
    userId: userB.id,
    collectionId: colAnime.id,
    rating: 9.5,
    content: "Masterpiece!",
  });

  // Buat TasteDNA untuk userB
  await TasteDNA.create({
    userId: userB.id,
    content: "You gravitate toward dark, complex narratives...",
    generatedAt: new Date(),
  });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── GET /users ────────────────────────────────────────────────────────────
describe("GET /users", () => {
  it("200 — mengembalikan semua user (tanpa filter)", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0]).toHaveProperty("username");
    expect(res.body.users[0]).toHaveProperty("avatar");
    expect(res.body.users[0]).not.toHaveProperty("password");
    expect(res.body.users[0]).not.toHaveProperty("email");
  });

  it("200 — filter by username (?q=searchTarget) mengembalikan user yang cocok", async () => {
    const res = await request(app).get("/users?q=searchTarget");
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0].username).toBe("searchTarget");
  });

  it("200 — filter partial username juga cocok (?q=search)", async () => {
    const res = await request(app).get("/users?q=search");
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0].username).toMatch(/search/i);
  });

  it("200 — q tidak cocok → array kosong", async () => {
    const res = await request(app).get("/users?q=usertiadadidb999xyz");
    expect(res.status).toBe(200);
    expect(res.body.users).toEqual([]);
  });
});

// ─── GET /users/:username ──────────────────────────────────────────────────
describe("GET /users/:username", () => {
  it("200 — berhasil ambil profil publik dengan semua field", async () => {
    const res = await request(app).get("/users/searchTarget");
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("username", "searchTarget");
    expect(res.body.user).toHaveProperty("bio");
    expect(res.body.user).toHaveProperty("joinedSince");
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("email");
  });

  it("200 — response memiliki stats, favorites, collections, tasteDNA", async () => {
    const res = await request(app).get("/users/searchTarget");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("stats");
    expect(res.body).toHaveProperty("favorites");
    expect(res.body).toHaveProperty("collections");
    expect(res.body).toHaveProperty("tasteDNA");
  });

  it("200 — stats menghitung media dengan benar", async () => {
    const res = await request(app).get("/users/searchTarget");
    expect(res.status).toBe(200);
    expect(res.body.stats.anime).toBe(1);
    expect(res.body.stats.manga).toBe(1);
    expect(res.body.stats.game).toBe(0);
  });

  it("200 — favorites hanya berisi item dengan isFavorite=true (max 5)", async () => {
    const res = await request(app).get("/users/searchTarget");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.favorites)).toBe(true);
    expect(res.body.favorites.length).toBeGreaterThan(0);
    res.body.favorites.forEach((fav) => {
      expect(fav.isFavorite).toBe(true);
    });
    expect(res.body.favorites.length).toBeLessThanOrEqual(5);
  });

  it("200 — tasteDNA ditampilkan jika sudah pernah generate", async () => {
    const res = await request(app).get("/users/searchTarget");
    expect(res.status).toBe(200);
    expect(res.body.tasteDNA).toHaveProperty("content");
    expect(res.body.tasteDNA).toHaveProperty("generatedAt");
  });

  it("200 — collections menyertakan Review (jika ada)", async () => {
    const res = await request(app).get("/users/searchTarget");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.collections)).toBe(true);
    const animeCol = res.body.collections.find((c) => c.externalId === "1535");
    expect(animeCol).toBeDefined();
    expect(animeCol).toHaveProperty("Review");
  });

  it("200 — user tanpa TasteDNA mengembalikan tasteDNA: null", async () => {
    const res = await request(app).get("/users/publicUser");
    expect(res.status).toBe(200);
    expect(res.body.tasteDNA).toBeNull();
  });

  it("404 — username tidak ditemukan", async () => {
    const res = await request(app).get("/users/usernameyangtiadadidb999xyz");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
  });
});
