const request = require("supertest");
const app = require("../app");
const { sequelize, User, Collection } = require("../models");
const { signToken } = require("../helpers/jwt");
const { generateContent } = require("../helpers/gemini");

// Mock helpers/gemini — tidak keluar biaya dan tidak perlu API key saat test
jest.mock("../helpers/gemini", () => {
  const actual = jest.requireActual("../helpers/gemini");
  return {
    ...actual,
    generateContent: jest.fn().mockResolvedValue(
      JSON.stringify({
        anime: [
          {
            title: "Berserk",
            reason: "Dark fantasy with complex characters.",
          },
        ],
        manga: [
          {
            title: "Vagabond",
            reason: "Historical samurai with deep themes.",
          },
        ],
        game: [{ title: "Dark Souls", reason: "Brutal, atmospheric world." }],
      }),
    ),
  };
});

// Mock externalApis — enrichAIResults juga tidak hit internet
jest.mock("../helpers/externalApis", () => ({
  enrichAIResults: jest.fn().mockResolvedValue({
    anime: [
      {
        title: "Berserk",
        reason: "Dark fantasy.",
        coverUrl: "http://cover.url",
        externalId: "2",
      },
    ],
    manga: [
      {
        title: "Vagabond",
        reason: "Historical.",
        coverUrl: "http://cover.url",
        externalId: "3",
      },
    ],
    game: [
      {
        title: "Dark Souls",
        reason: "Brutal.",
        coverUrl: "http://cover.url",
        externalId: "292",
      },
    ],
  }),
  searchJikanAnime: jest.fn(),
  searchJikanManga: jest.fn(),
  searchIGDB: jest.fn(),
  getDetailJikan: jest.fn(),
  getDetailIGDB: jest.fn(),
  getIGDBToken: jest.fn(),
}));

let token, user, col1, col2;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  user = await User.create({
    username: "aiuser",
    email: "ai@mail.com",
    password: "pass123",
    loginMethod: "local",
  });
  token = signToken({ id: user.id, email: user.email });

  col1 = await Collection.create({
    userId: user.id,
    mediaType: "anime",
    externalId: "1",
    title: "Berserk",
    status: "completed",
    genres: ["Action", "Fantasy"],
    synopsis: "A mercenary...",
    score: 8.7,
  });
  col2 = await Collection.create({
    userId: user.id,
    mediaType: "manga",
    externalId: "2",
    title: "Vagabond",
    status: "ongoing",
    genres: ["Action", "Historical"],
    synopsis: "A samurai...",
    score: 9.1,
  });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── POST /ai/taste-dna ────────────────────────────────────────────────────
describe("POST /ai/taste-dna", () => {
  it("200 — generate Taste DNA berhasil", async () => {
    const res = await request(app)
      .post("/ai/taste-dna")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content");
    expect(res.body).toHaveProperty("generatedAt");
  });

  it("200 — regenerate (upsert) berhasil, tidak error", async () => {
    const res = await request(app)
      .post("/ai/taste-dna")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("200 — regenerate mengupdate content jika hasil AI berubah", async () => {
    generateContent
      .mockResolvedValueOnce("Taste DNA versi lama")
      .mockResolvedValueOnce("Taste DNA versi baru");

    const first = await request(app)
      .post("/ai/taste-dna")
      .set("Authorization", `Bearer ${token}`);

    const second = await request(app)
      .post("/ai/taste-dna")
      .set("Authorization", `Bearer ${token}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.content).toBe("Taste DNA versi baru");
  });

  it("400 — koleksi kosong", async () => {
    const emptyUser = await User.create({
      username: "emptyuser",
      email: "empty@mail.com",
      password: "pass123",
      loginMethod: "local",
    });
    const emptyToken = signToken({ id: emptyUser.id, email: emptyUser.email });
    const res = await request(app)
      .post("/ai/taste-dna")
      .set("Authorization", `Bearer ${emptyToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/collection/i);
  });

  it("401 — tanpa token", async () => {
    const res = await request(app).post("/ai/taste-dna");
    expect(res.status).toBe(401);
  });
});

// ─── POST /ai/vibe-match ───────────────────────────────────────────────────
describe("POST /ai/vibe-match", () => {
  it("200 — vibe match berhasil", async () => {
    const res = await request(app)
      .post("/ai/vibe-match")
      .set("Authorization", `Bearer ${token}`)
      .send({
        referenceIds: [col1.id, col2.id],
        targetMediaTypes: ["anime", "game"],
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("anime");
    expect(res.body).toHaveProperty("game");
  });

  it("400 — referenceIds kosong", async () => {
    const res = await request(app)
      .post("/ai/vibe-match")
      .set("Authorization", `Bearer ${token}`)
      .send({ referenceIds: [], targetMediaTypes: ["anime"] });
    expect(res.status).toBe(400);
  });

  it("400 — targetMediaTypes tidak dikirim", async () => {
    const res = await request(app)
      .post("/ai/vibe-match")
      .set("Authorization", `Bearer ${token}`)
      .send({ referenceIds: [col1.id] });
    expect(res.status).toBe(400);
  });

  it("404 — referenceIds tidak ditemukan di koleksi user", async () => {
    const res = await request(app)
      .post("/ai/vibe-match")
      .set("Authorization", `Bearer ${token}`)
      .send({ referenceIds: [99999], targetMediaTypes: ["anime"] });
    expect(res.status).toBe(404);
  });

  it("200 — vibe match tetap berhasil saat metadata koleksi minim (uji fallback prompt)", async () => {
    const sparse = await Collection.create({
      userId: user.id,
      mediaType: "game",
      externalId: "777",
      title: "Sparse Data",
      status: "plan",
      genres: null,
      synopsis: null,
      score: null,
    });

    const res = await request(app)
      .post("/ai/vibe-match")
      .set("Authorization", `Bearer ${token}`)
      .send({
        referenceIds: [sparse.id],
        targetMediaTypes: ["anime"],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("anime");
  });
});

// ─── POST /ai/title-match ──────────────────────────────────────────────────
describe("POST /ai/title-match", () => {
  it("200 — title match berhasil", async () => {
    const res = await request(app)
      .post("/ai/title-match")
      .set("Authorization", `Bearer ${token}`)
      .send({ collectionId: col1.id });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("anime");
    expect(res.body).toHaveProperty("manga");
    expect(res.body).toHaveProperty("game");
  });

  it("400 — collectionId tidak dikirim", async () => {
    const res = await request(app)
      .post("/ai/title-match")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("404 — collectionId tidak ditemukan", async () => {
    const res = await request(app)
      .post("/ai/title-match")
      .set("Authorization", `Bearer ${token}`)
      .send({ collectionId: 99999 });
    expect(res.status).toBe(404);
  });
});
