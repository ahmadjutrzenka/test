const request = require("supertest");
const app = require("../app");
const { sequelize, User, Collection, Review } = require("../models");

// Mock semua external API — tidak hit internet saat test
jest.mock("../helpers/externalApis", () => ({
  getDetailJikan: jest.fn().mockResolvedValue({
    mal_id: 1535,
    title: "Death Note",
    images: {
      jpg: {
        image_url: "http://img.url",
        large_image_url: "http://img.url",
      },
    },
    score: 9.0,
    genres: [{ name: "Mystery" }, { name: "Psychological" }],
    themes: [{ name: "Psychological" }],
    synopsis: "A student finds a notebook that can kill...",
    status: "Finished Airing",
    episodes: 37,
  }),
  getDetailIGDB: jest.fn().mockResolvedValue({
    id: 1942,
    name: "Grand Theft Auto V",
    cover: { url: "//images.igdb.com/t_thumb/abc.jpg" },
    rating: 96,
    genres: [{ name: "Adventure" }],
    summary: "Open world crime game.",
    involved_companies: [{ company: { name: "Rockstar Games" } }],
  }),
  searchJikanAnime: jest.fn(),
  searchJikanManga: jest.fn(),
  searchIGDB: jest.fn(),
  enrichAIResults: jest.fn(),
  getIGDBToken: jest.fn(),
}));

let userA, animeColId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  userA = await User.create({
    username: "mediauser",
    email: "media@mail.com",
    password: "pass123",
    loginMethod: "local",
  });

  // Koleksi anime yang punya review
  const animeCol = await Collection.create({
    userId: userA.id,
    mediaType: "anime",
    externalId: "1535",
    title: "Death Note",
    status: "completed",
  });
  animeColId = animeCol.id;

  await Review.create({
    userId: userA.id,
    collectionId: animeCol.id,
    rating: 9.5,
    content: "Masterpiece of psychological thriller!",
  });

  // Koleksi manga (tanpa review) untuk eksternalId berbeda
  await Collection.create({
    userId: userA.id,
    mediaType: "manga",
    externalId: "25",
    title: "Fullmetal Alchemist",
    status: "completed",
  });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── GET /media/:type/:externalId ─────────────────────────────────────────
describe("GET /media/:type/:externalId", () => {
  it("200 — berhasil ambil detail anime beserta reviews VibeSync", async () => {
    const res = await request(app).get("/media/anime/1535");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mediaInfo");
    expect(res.body).toHaveProperty("reviews");
    expect(Array.isArray(res.body.reviews)).toBe(true);
  });

  it("200 — reviews memiliki field isEdited dan User", async () => {
    const res = await request(app).get("/media/anime/1535");
    expect(res.status).toBe(200);
    expect(res.body.reviews.length).toBeGreaterThan(0);
    expect(res.body.reviews[0]).toHaveProperty("isEdited");
    expect(res.body.reviews[0]).toHaveProperty("User");
    expect(res.body.reviews[0].User).toHaveProperty("username");
  });

  it("200 — berhasil ambil detail manga (reviews kosong jika tidak ada)", async () => {
    const res = await request(app).get("/media/manga/25");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mediaInfo");
    expect(res.body).toHaveProperty("reviews");
    expect(Array.isArray(res.body.reviews)).toBe(true);
  });

  it("200 — berhasil ambil detail game, reviews kosong karena tidak ada koleksi game", async () => {
    const res = await request(app).get("/media/game/1942");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mediaInfo");
    expect(res.body.reviews).toEqual([]);
  });

  it("400 — type tidak valid", async () => {
    const res = await request(app).get("/media/film/1");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("404 — media tidak ditemukan (Jikan return null)", async () => {
    const { getDetailJikan } = require("../helpers/externalApis");
    getDetailJikan.mockResolvedValueOnce(null);
    const res = await request(app).get("/media/anime/99999");
    expect(res.status).toBe(404);
  });

  it("404 — game tidak ditemukan (IGDB return null)", async () => {
    const { getDetailIGDB } = require("../helpers/externalApis");
    getDetailIGDB.mockResolvedValueOnce(null);
    const res = await request(app).get("/media/game/99999");
    expect(res.status).toBe(404);
  });
});