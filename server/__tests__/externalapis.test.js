jest.mock("axios");
const axios = require("axios");

// Import setelah mock terdaftar
const {
  getIGDBToken,
  searchJikanAnime,
  searchJikanManga,
  searchIGDB,
  getDetailJikan,
  getDetailIGDB,
  enrichAIResults,
} = require("../helpers/externalApis");

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getIGDBToken ──────────────────────────────────────────────────────────
describe("getIGDBToken", () => {
  it("mendapatkan token baru dari Twitch OAuth", async () => {
    axios.post.mockResolvedValueOnce({
      data: { access_token: "fresh-igdb-token", expires_in: 5184000 },
    });
    const token = await getIGDBToken();
    expect(token).toBe("fresh-igdb-token");
    expect(axios.post).toHaveBeenCalledWith(
      "https://id.twitch.tv/oauth2/token",
      null,
      expect.objectContaining({ params: expect.any(Object) }),
    );
  });

  it("menggunakan cache jika token masih valid (tidak hit axios lagi)", async () => {
    // Token sudah di-cache dari test sebelumnya — tidak perlu mock
    const token = await getIGDBToken();
    expect(typeof token).toBe("string");
    expect(axios.post).not.toHaveBeenCalled();
  });
});

// ─── searchJikanAnime ─────────────────────────────────────────────────────
describe("searchJikanAnime", () => {
  it("mengembalikan array anime dari Jikan", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            mal_id: 1535,
            title: "Death Note",
            images: { jpg: { image_url: "http://img.url" } },
            score: 9.0,
            genres: [{ name: "Mystery" }],
            synopsis: "A notebook...",
          },
        ],
      },
    });
    const result = await searchJikanAnime("death note");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("mal_id", 1535);
    expect(result[0]).toHaveProperty("title", "Death Note");
    expect(axios.get).toHaveBeenCalledWith(
      "https://api.jikan.moe/v4/anime",
      expect.objectContaining({ params: { q: "death note", limit: 8 } }),
    );
  });

  it("mengembalikan array kosong jika tidak ada hasil (data undefined)", async () => {
    axios.get.mockResolvedValueOnce({ data: {} });
    const result = await searchJikanAnime("xyzxyzxyz123");
    expect(result).toEqual([]);
  });
});

// ─── searchJikanManga ─────────────────────────────────────────────────────
describe("searchJikanManga", () => {
  it("mengembalikan array manga dari Jikan", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            mal_id: 25,
            title: "Fullmetal Alchemist",
            images: { jpg: { image_url: "http://img.url" } },
            score: 9.1,
            genres: [{ name: "Action" }],
            synopsis: "Two brothers...",
          },
        ],
      },
    });
    const result = await searchJikanManga("fullmetal");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("mal_id", 25);
    expect(result[0]).toHaveProperty("title", "Fullmetal Alchemist");
    expect(axios.get).toHaveBeenCalledWith(
      "https://api.jikan.moe/v4/manga",
      expect.objectContaining({ params: { q: "fullmetal", limit: 8 } }),
    );
  });

  it("mengembalikan array kosong jika data tidak ada", async () => {
    axios.get.mockResolvedValueOnce({ data: {} });
    const result = await searchJikanManga("xyzxyzxyz123");
    expect(result).toEqual([]);
  });
});

// ─── searchIGDB ───────────────────────────────────────────────────────────
describe("searchIGDB", () => {
  it("mengembalikan array game dari IGDB", async () => {
    // Token sudah di-cache — hanya perlu mock data call
    axios.post.mockResolvedValueOnce({
      data: [
        {
          id: 1942,
          name: "Grand Theft Auto V",
          cover: { url: "//images.igdb.com/t_thumb/abc.jpg" },
          rating: 96,
        },
      ],
    });
    const result = await searchIGDB("gta");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("id", 1942);
    expect(result[0]).toHaveProperty("name", "Grand Theft Auto V");
  });

  it("mengembalikan array kosong jika tidak ada game ditemukan", async () => {
    axios.post.mockResolvedValueOnce({ data: [] });
    const result = await searchIGDB("xyzgametidakada999");
    expect(result).toEqual([]);
  });
});

// ─── getDetailJikan ───────────────────────────────────────────────────────
describe("getDetailJikan", () => {
  it("mengembalikan detail anime dari Jikan", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: {
          mal_id: 1535,
          title: "Death Note",
          score: 9.0,
          genres: [{ name: "Mystery" }],
          synopsis: "A notebook...",
          status: "Finished Airing",
          episodes: 37,
        },
      },
    });
    const result = await getDetailJikan("1535", "anime");
    expect(result).toHaveProperty("mal_id", 1535);
    expect(result).toHaveProperty("title", "Death Note");
    expect(axios.get).toHaveBeenCalledWith(
      "https://api.jikan.moe/v4/anime/1535",
    );
  });

  it("mengembalikan detail manga dari Jikan", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: {
          mal_id: 25,
          title: "Fullmetal Alchemist",
          score: 9.1,
          chapters: 108,
        },
      },
    });
    const result = await getDetailJikan("25", "manga");
    expect(result).toHaveProperty("mal_id", 25);
    expect(axios.get).toHaveBeenCalledWith("https://api.jikan.moe/v4/manga/25");
  });

  it("mengembalikan null jika data tidak ditemukan", async () => {
    axios.get.mockResolvedValueOnce({ data: {} });
    const result = await getDetailJikan("99999", "anime");
    expect(result).toBeNull();
  });
});

// ─── getDetailIGDB ────────────────────────────────────────────────────────
describe("getDetailIGDB", () => {
  it("mengembalikan detail game pertama dari IGDB", async () => {
    axios.post.mockResolvedValueOnce({
      data: [
        {
          id: 1942,
          name: "Grand Theft Auto V",
          cover: { url: "//images.igdb.com/t_thumb/abc.jpg" },
          rating: 96,
          genres: [{ name: "Adventure" }],
          summary: "Open world crime game.",
          involved_companies: [{ company: { name: "Rockstar Games" } }],
        },
      ],
    });
    const result = await getDetailIGDB("1942");
    expect(result).toHaveProperty("id", 1942);
    expect(result).toHaveProperty("name", "Grand Theft Auto V");
  });

  it("mengembalikan null jika array kosong", async () => {
    axios.post.mockResolvedValueOnce({ data: [] });
    const result = await getDetailIGDB("99999");
    expect(result).toBeNull();
  });
});

// ─── enrichAIResults ──────────────────────────────────────────────────────
describe("enrichAIResults", () => {
  it("melengkapi hasil anime dengan coverUrl dan externalId", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            mal_id: 2,
            title: "Berserk",
            images: { jpg: { image_url: "http://berserk.jpg" } },
          },
        ],
      },
    });

    const results = {
      anime: [{ title: "Berserk", reason: "Dark fantasy" }],
      manga: [],
      game: [],
    };
    const enriched = await enrichAIResults(results);

    expect(enriched.anime[0]).toHaveProperty("coverUrl", "http://berserk.jpg");
    expect(enriched.anime[0]).toHaveProperty("externalId", "2");
    expect(enriched.anime[0]).toHaveProperty("title", "Berserk");
    expect(enriched.anime[0]).toHaveProperty("reason", "Dark fantasy");
  });

  it("melengkapi hasil manga dengan coverUrl dan externalId", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            mal_id: 3,
            title: "Vagabond",
            images: { jpg: { image_url: "http://vagabond.jpg" } },
          },
        ],
      },
    });

    const results = {
      anime: [],
      manga: [{ title: "Vagabond", reason: "Historical samurai" }],
      game: [],
    };
    const enriched = await enrichAIResults(results);

    expect(enriched.manga[0]).toHaveProperty("coverUrl", "http://vagabond.jpg");
    expect(enriched.manga[0]).toHaveProperty("externalId", "3");
  });

  it("melengkapi hasil game dengan coverUrl https dan externalId", async () => {
    axios.post.mockResolvedValueOnce({
      data: [
        {
          id: 292,
          name: "Dark Souls",
          cover: { url: "//images.igdb.com/t_thumb/darksouls.jpg" },
        },
      ],
    });

    const results = {
      anime: [],
      manga: [],
      game: [{ title: "Dark Souls", reason: "Brutal atmosphere" }],
    };
    const enriched = await enrichAIResults(results);

    expect(enriched.game[0].coverUrl).toMatch(/^https:/);
    expect(enriched.game[0].coverUrl).toContain("t_cover_big");
    expect(enriched.game[0]).toHaveProperty("externalId", "292");
  });

  it("coverUrl null dan externalId null jika tidak ada hasil dari API", async () => {
    axios.get
      .mockResolvedValueOnce({ data: {} }) // anime not found
      .mockResolvedValueOnce({ data: {} }); // manga not found
    axios.post.mockResolvedValueOnce({ data: [] }); // game not found

    const results = {
      anime: [{ title: "TidakAda", reason: "..." }],
      manga: [{ title: "TidakAda2", reason: "..." }],
      game: [{ title: "TidakAda3", reason: "..." }],
    };
    const enriched = await enrichAIResults(results);

    expect(enriched.anime[0].coverUrl).toBeNull();
    expect(enriched.anime[0].externalId).toBeNull();
    expect(enriched.manga[0].coverUrl).toBeNull();
    expect(enriched.manga[0].externalId).toBeNull();
    expect(enriched.game[0].coverUrl).toBeNull();
    expect(enriched.game[0].externalId).toBeNull();
  });
});
