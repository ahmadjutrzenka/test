const request = require("supertest");
const app = require("../app");
const { sequelize, User } = require("../models");
const { signToken } = require("../helpers/jwt");
const externalApis = require("../helpers/externalApis");

// Mock semua external API — tidak hit internet saat test
jest.mock("../helpers/externalApis", () => ({
  searchJikanAnime: jest.fn().mockResolvedValue([
    {
      mal_id: 1535,
      title: "Death Note",
      images: { jpg: { image_url: "http://img.url" } },
      score: 9.0,
      genres: [{ name: "Mystery" }],
      synopsis: "A notebook...",
    },
  ]),
  searchJikanManga: jest.fn().mockResolvedValue([
    {
      mal_id: 25,
      title: "Fullmetal Alchemist",
      images: { jpg: { image_url: "http://img.url" } },
      score: 9.1,
      genres: [{ name: "Action" }],
      synopsis: "Two brothers...",
    },
  ]),
  searchIGDB: jest.fn().mockResolvedValue([
    {
      id: 1942,
      name: "Grand Theft Auto V",
      cover: { url: "//images.igdb.com/t_thumb/abc.jpg" },
      rating: 96,
      genres: [{ name: "Adventure" }],
      summary: "Open world game.",
    },
  ]),
  getDetailJikan: jest.fn().mockResolvedValue({
    mal_id: 1535,
    title: "Death Note",
    images: {
      jpg: { image_url: "http://img.url", large_image_url: "http://img.url" },
    },
    score: 9.0,
    genres: [{ name: "Mystery" }],
    themes: [{ name: "Psychological" }],
    synopsis: "A notebook...",
    status: "Finished Airing",
    episodes: 37,
  }),
  getDetailIGDB: jest.fn().mockResolvedValue({
    id: 1942,
    name: "Grand Theft Auto V",
    cover: { url: "//images.igdb.com/t_thumb/abc.jpg" },
    rating: 96,
    genres: [{ name: "Adventure" }],
    summary: "Open world game.",
    involved_companies: [{ company: { name: "Rockstar Games" } }],
  }),
  enrichAIResults: jest.fn(),
  getIGDBToken: jest.fn(),
}));

let token;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const user = await User.create({
    username: "searcher",
    email: "s@mail.com",
    password: "pass123",
    loginMethod: "local",
  });
  token = signToken({ id: user.id, email: user.email });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── GET /search ───────────────────────────────────────────────────────────
describe("GET /search", () => {
  it("200 — type=anime mengembalikan hasil anime", async () => {
    const res = await request(app)
      .get("/search?q=death+note&type=anime")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.anime.length).toBeGreaterThan(0);
    expect(res.body.anime[0]).toHaveProperty("externalId");
    expect(res.body.anime[0]).toHaveProperty("mediaType", "anime");
  });

  it("200 — type=game mengembalikan hasil game", async () => {
    const res = await request(app)
      .get("/search?q=gta&type=game")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.game.length).toBeGreaterThan(0);
  });

  it("200 — type=anime memetakan fallback null/[] saat field eksternal kosong", async () => {
    externalApis.searchJikanAnime.mockResolvedValueOnce([
      {
        mal_id: 999,
        title: "Anime Tanpa Metadata",
      },
    ]);

    const res = await request(app)
      .get("/search?q=fallback&type=anime")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.anime[0]).toMatchObject({
      externalId: "999",
      title: "Anime Tanpa Metadata",
      coverUrl: null,
      score: null,
      genres: [],
      synopsis: null,
      mediaType: "anime",
    });
  });

  it("200 — type=manga memetakan fallback null/[] saat field eksternal kosong", async () => {
    externalApis.searchJikanManga.mockResolvedValueOnce([
      {
        mal_id: 998,
        title: "Manga Tanpa Metadata",
      },
    ]);

    const res = await request(app)
      .get("/search?q=fallback&type=manga")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.manga[0]).toMatchObject({
      externalId: "998",
      title: "Manga Tanpa Metadata",
      coverUrl: null,
      score: null,
      genres: [],
      synopsis: null,
      mediaType: "manga",
    });
  });

  it("200 — type=game memetakan fallback null/[] saat field eksternal kosong", async () => {
    externalApis.searchIGDB.mockResolvedValueOnce([
      {
        id: 777,
        name: "Game Tanpa Metadata",
      },
    ]);

    const res = await request(app)
      .get("/search?q=fallback&type=game")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.game[0]).toMatchObject({
      externalId: "777",
      title: "Game Tanpa Metadata",
      coverUrl: null,
      score: null,
      genres: [],
      synopsis: null,
      mediaType: "game",
    });
  });

  it("200 — type=user mengembalikan hasil dari DB", async () => {
    const res = await request(app)
      .get("/search?q=searcher&type=user")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it("200 — type=all mengembalikan semua kategori", async () => {
    const res = await request(app)
      .get("/search?q=test&type=all")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("anime");
    expect(res.body).toHaveProperty("manga");
    expect(res.body).toHaveProperty("game");
    expect(res.body).toHaveProperty("users");
  });

  it("400 — q tidak dikirim", async () => {
    const res = await request(app)
      .get("/search?type=anime")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("400 — type tidak valid", async () => {
    const res = await request(app)
      .get("/search?q=test&type=film")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("401 — tanpa token", async () => {
    const res = await request(app).get("/search?q=test");
    expect(res.status).toBe(401);
  });
});

// ─── GET /search/detail ────────────────────────────────────────────────────
describe("GET /search/detail", () => {
  it("200 — detail anime berhasil", async () => {
    const res = await request(app)
      .get("/search/detail?id=1535&type=anime")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("externalId", "1535");
    expect(res.body).toHaveProperty("mediaType", "anime");
  });

  it("200 — detail game berhasil", async () => {
    const res = await request(app)
      .get("/search/detail?id=1942&type=game")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mediaType", "game");
  });

  it("200 — detail manga berhasil (jalur anime/manga)", async () => {
    const res = await request(app)
      .get("/search/detail?id=25&type=manga")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("externalId", "1535");
  });

  it("200 — detail anime fallback null/[] saat field kosong", async () => {
    externalApis.getDetailJikan.mockResolvedValueOnce({
      mal_id: 1234,
      title: "Anime Bare",
    });

    const res = await request(app)
      .get("/search/detail?id=1234&type=anime")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      externalId: "1234",
      title: "Anime Bare",
      coverUrl: null,
      score: null,
      genres: [],
      synopsis: null,
      status: null,
      episodes: null,
      chapters: null,
      mediaType: "anime",
    });
  });

  it("200 — detail game fallback null/[] saat field kosong", async () => {
    externalApis.getDetailIGDB.mockResolvedValueOnce({
      id: 555,
      name: "Game Bare",
    });

    const res = await request(app)
      .get("/search/detail?id=555&type=game")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      externalId: "555",
      title: "Game Bare",
      coverUrl: null,
      score: null,
      genres: [],
      synopsis: null,
      developers: [],
      mediaType: "game",
    });
  });

  it("404 — detail anime/manga tidak ditemukan", async () => {
    externalApis.getDetailJikan.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/search/detail?id=99999&type=manga")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("404 — detail game tidak ditemukan", async () => {
    externalApis.getDetailIGDB.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/search/detail?id=99999&type=game")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("400 — id tidak dikirim", async () => {
    const res = await request(app)
      .get("/search/detail?type=anime")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("400 — type tidak dikirim", async () => {
    const res = await request(app)
      .get("/search/detail?id=1535")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
