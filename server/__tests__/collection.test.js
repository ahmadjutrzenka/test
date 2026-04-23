const request = require("supertest");
const app = require("../app");
const { sequelize, User, Collection } = require("../models");
const { signToken } = require("../helpers/jwt");

let tokenA, tokenB, userA, userB, collectionId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Dua user: A = owner, B = orang lain
  userA = await User.create({
    username: "userA",
    email: "a@mail.com",
    password: "pass123",
    loginMethod: "local",
  });
  userB = await User.create({
    username: "userB",
    email: "b@mail.com",
    password: "pass123",
    loginMethod: "local",
  });

  tokenA = signToken({ id: userA.id, email: userA.email });
  tokenB = signToken({ id: userB.id, email: userB.email });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── POST /collections ─────────────────────────────────────────────────────
describe("POST /collections", () => {
  it("201 — berhasil tambah koleksi", async () => {
    const res = await request(app)
      .post("/collections")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        mediaType: "anime",
        externalId: "1535",
        title: "Death Note",
        status: "completed",
        score: 9.0,
        genres: ["Mystery", "Psychological"],
        synopsis: "A student finds a notebook...",
      });
    expect(res.status).toBe(201);
    expect(res.body.collection).toHaveProperty("title", "Death Note");
    expect(res.body.collection).toHaveProperty("userId", userA.id);
    collectionId = res.body.collection.id;
  });

  it("400 — title yang sama tidak bisa ditambahkan dua kali untuk user yang sama", async () => {
    const res = await request(app)
      .post("/collections")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        mediaType: "anime",
        externalId: "1535",
        title: "Death Note",
        status: "completed",
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already in your collection/i);
  });

  it("400 — mediaType tidak valid", async () => {
    const res = await request(app)
      .post("/collections")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        mediaType: "film",
        externalId: "1",
        title: "Test",
        status: "plan",
      });
    expect(res.status).toBe(400);
  });

  it("400 — status tidak dikirim", async () => {
    const res = await request(app)
      .post("/collections")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ mediaType: "anime", externalId: "1", title: "Test" });
    expect(res.status).toBe(400);
  });

  it("401 — tanpa token", async () => {
    const res = await request(app)
      .post("/collections")
      .send({ mediaType: "anime" });
    expect(res.status).toBe(401);
  });
});

// ─── GET /collections ──────────────────────────────────────────────────────
describe("GET /collections", () => {
  it("200 — berhasil ambil semua koleksi milik sendiri", async () => {
    const res = await request(app)
      .get("/collections")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.collections)).toBe(true);
    expect(res.body.collections[0]).toHaveProperty("userId", userA.id);
  });

  it("200 — filter by type berhasil", async () => {
    const res = await request(app)
      .get("/collections?type=anime")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    res.body.collections.forEach((c) => expect(c.mediaType).toBe("anime"));
  });

  it("400 — type tidak valid", async () => {
    const res = await request(app)
      .get("/collections?type=film")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(400);
  });
});

// ─── GET /collections/:id ──────────────────────────────────────────────────
describe("GET /collections/:id", () => {
  it("200 — berhasil ambil koleksi milik sendiri", async () => {
    const res = await request(app)
      .get(`/collections/${collectionId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.collection.id).toBe(collectionId);
  });

  it("403 — akses koleksi milik user lain", async () => {
    const res = await request(app)
      .get(`/collections/${collectionId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it("404 — id tidak ditemukan", async () => {
    const res = await request(app)
      .get("/collections/99999")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /collections/:id ────────────────────────────────────────────────
describe("PATCH /collections/:id", () => {
  it("200 — update status berhasil", async () => {
    const res = await request(app)
      .patch(`/collections/${collectionId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ status: "ongoing" });
    expect(res.status).toBe(200);
    expect(res.body.collection.status).toBe("ongoing");
  });

  it("200 — set isFavorite true berhasil", async () => {
    const res = await request(app)
      .patch(`/collections/${collectionId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ isFavorite: true });
    expect(res.status).toBe(200);
    expect(res.body.collection.isFavorite).toBe(true);
  });

  it("400 — sudah 5 favorites, tidak bisa tambah lagi", async () => {
    // Buat 4 koleksi lagi dan set semua jadi favorite
    for (let i = 2; i <= 5; i++) {
      const col = await Collection.create({
        userId: userA.id,
        mediaType: "manga",
        externalId: String(i),
        title: `Manga ${i}`,
        status: "plan",
      });
      await col.update({ isFavorite: true });
    }
    // Buat koleksi ke-6 dan coba set favorite
    const extra = await Collection.create({
      userId: userA.id,
      mediaType: "game",
      externalId: "99",
      title: "Extra Game",
      status: "plan",
    });
    const res = await request(app)
      .patch(`/collections/${extra.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ isFavorite: true });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/5/i);
  });

  it("403 — update koleksi milik user lain", async () => {
    const res = await request(app)
      .patch(`/collections/${collectionId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ status: "dropped" });
    expect(res.status).toBe(403);
  });
});

// ─── DELETE /collections/:id ───────────────────────────────────────────────
describe("DELETE /collections/:id", () => {
  it("403 — hapus koleksi milik user lain", async () => {
    const res = await request(app)
      .delete(`/collections/${collectionId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it("200 — hapus koleksi sendiri berhasil", async () => {
    const res = await request(app)
      .delete(`/collections/${collectionId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(new RegExp(collectionId));
  });

  it("404 — hapus id yang tidak ada", async () => {
    const res = await request(app)
      .delete(`/collections/${collectionId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
  });
});
