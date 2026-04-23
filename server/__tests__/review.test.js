const request = require("supertest");
const app = require("../app");
const { sequelize, User, Collection, Review } = require("../models");
const { signToken } = require("../helpers/jwt");

let tokenA, tokenB, userA, userB, collection, reviewId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  userA = await User.create({
    username: "reviewerA",
    email: "ra@mail.com",
    password: "pass123",
    loginMethod: "local",
  });
  userB = await User.create({
    username: "reviewerB",
    email: "rb@mail.com",
    password: "pass123",
    loginMethod: "local",
  });
  tokenA = signToken({ id: userA.id, email: userA.email });
  tokenB = signToken({ id: userB.id, email: userB.email });

  collection = await Collection.create({
    userId: userA.id,
    mediaType: "anime",
    externalId: "1535",
    title: "Death Note",
    status: "completed",
  });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── GET /reviews/recent ───────────────────────────────────────────────────
describe("GET /reviews/recent", () => {
  it("200 — berhasil (array, meski kosong)", async () => {
    const res = await request(app).get("/reviews/recent");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── POST /reviews ─────────────────────────────────────────────────────────
describe("POST /reviews", () => {
  it("201 — buat review berhasil", async () => {
    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        collectionId: collection.id,
        rating: 9.5,
        content: "Masterpiece!",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("rating", 9.5);
    reviewId = res.body.id;
  });

  it("400 — tidak ada rating maupun content", async () => {
    const col2 = await Collection.create({
      userId: userA.id,
      mediaType: "manga",
      externalId: "2",
      title: "Test Manga",
      status: "plan",
    });
    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ collectionId: col2.id });
    expect(res.status).toBe(400);
  });

  it("400 — duplicate: sudah ada review untuk collection ini", async () => {
    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ collectionId: collection.id, rating: 8.0 });
    expect(res.status).toBe(400);
  });

  it("403 — review collection milik user lain", async () => {
    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ collectionId: collection.id, rating: 7.0 });
    expect(res.status).toBe(403);
  });

  it("404 — collectionId tidak ditemukan", async () => {
    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ collectionId: 99999, rating: 8.0 });
    expect(res.status).toBe(404);
  });

  it("401 — tanpa token", async () => {
    const res = await request(app)
      .post("/reviews")
      .send({ collectionId: collection.id, rating: 7.0 });
    expect(res.status).toBe(401);
  });
});

// ─── GET /reviews/:id ──────────────────────────────────────────────────────
describe("GET /reviews/:id", () => {
  it("200 — berhasil dengan field isEdited", async () => {
    const res = await request(app).get(`/reviews/${reviewId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("isEdited");
    expect(res.body).toHaveProperty("User");
    expect(res.body).toHaveProperty("Collection");
  });

  it("404 — id tidak ditemukan", async () => {
    const res = await request(app).get("/reviews/99999");
    expect(res.status).toBe(404);
  });
});

// ─── GET /reviews/recent setelah ada data ─────────────────────────────────
describe("GET /reviews/recent (setelah ada data)", () => {
  it("200 — mengembalikan review terbaru, ada isEdited", async () => {
    const res = await request(app).get("/reviews/recent");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("isEdited");
    expect(res.body[0]).toHaveProperty("User");
    expect(res.body[0]).toHaveProperty("Collection");
  });
});

// ─── PATCH /reviews/:id ────────────────────────────────────────────────────
describe("PATCH /reviews/:id", () => {
  it("200 — update review berhasil, updatedAt berubah", async () => {
    // Tunggu 1 detik agar updatedAt pasti berbeda dari createdAt
    await new Promise((r) => setTimeout(r, 1100));

    const res = await request(app)
      .patch(`/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ content: "Edited: still a masterpiece!" });
    expect(res.status).toBe(200);
    expect(res.body.isEdited).toBe(true);
    expect(res.body.content).toBe("Edited: still a masterpiece!");
  });

  it("403 — edit review milik user lain", async () => {
    const res = await request(app)
      .patch(`/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ content: "Hack attempt" });
    expect(res.status).toBe(403);
  });
});

// ─── DELETE /reviews/:id ───────────────────────────────────────────────────
describe("DELETE /reviews/:id", () => {
  it("403 — hapus review milik user lain", async () => {
    const res = await request(app)
      .delete(`/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it("200 — hapus review sendiri berhasil", async () => {
    const res = await request(app)
      .delete(`/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
  });

  it("404 — hapus review yang sudah tidak ada", async () => {
    const res = await request(app)
      .delete(`/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
  });
});
