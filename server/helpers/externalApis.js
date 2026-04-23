const axios = require("axios");

let _igdbToken = null;
let _tokenExpiry = 0;

async function getIGDBToken() {
  if (_igdbToken && Date.now() < _tokenExpiry) return _igdbToken;

  const response = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: process.env.IGDB_CLIENT_ID,
      client_secret: process.env.IGDB_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });
  _igdbToken = response.data.access_token;
  _tokenExpiry = Date.now() + (response.data.expires_in - 3600) * 1000;
  return _igdbToken;
}

async function searchJikanAnime(query) {
  const response = await axios.get("https://api.jikan.moe/v4/anime", {
    params: { q: query, limit: 8 },
  });
  return response.data.data || [];
}

async function searchJikanManga(query) {
  const response = await axios.get("https://api.jikan.moe/v4/manga", {
    params: { q: query, limit: 8 },
  });
  return response.data.data || [];
}

async function searchIGDB(query) {
  const token = await getIGDBToken();
  const response = await axios.post(
    "https://api.igdb.com/v4/games",
    `fields name,cover.url,genres.name,summary,rating,first_release_date; search "${query}"; limit 8;`,
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
    },
  );
  return response.data || [];
}

async function getDetailJikan(id, type) {
  const response = await axios.get(`https://api.jikan.moe/v4/${type}/${id}`);
  return response.data.data || null;
}

async function getDetailIGDB(id) {
  const token = await getIGDBToken();
  const response = await axios.post(
    "https://api.igdb.com/v4/games",
    `fields name,cover.url,genres.name,themes.name,summary,storyline,rating,rating_count,first_release_date,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,platforms.name; where id = ${id};`,
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
    },
  );
  return response.data[0] || null;
}

async function enrichAIResults(results) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const enriched = {
    anime: [],
    manga: [],
    game: [],
  };
  for (const item of results.anime || []) {
    const found = await searchJikanAnime(item.title);
    const match = found[0];
    enriched.anime.push({
      ...item,
      coverUrl: match?.images?.jpg?.image_url || null,
      externalId: match ? String(match.mal_id) : null,
    });
    await delay(400);
  }
  for (const item of results.manga || []) {
    const found = await searchJikanManga(item.title);
    const match = found[0];
    enriched.manga.push({
      ...item,
      coverUrl: match?.images?.jpg?.image_url || null,
      externalId: match ? String(match.mal_id) : null,
    });
    await delay(400);
  }
  for (const item of results.game || []) {
    const found = await searchIGDB(item.title);
    const match = found[0];
    const rawCover = match?.cover?.url || null;
    enriched.game.push({
      ...item,
      coverUrl: rawCover
        ? `https:` + rawCover.replace("t_thumb", "t_cover_big")
        : null,
      externalId: match ? String(match.id) : null,
    });
  }
  return enriched;
}

async function getTopJikanAnime(limit = 3) {
  const response = await axios.get("https://api.jikan.moe/v4/top/anime", {
    params: { limit },
  });
  return response.data.data || [];
}

async function getTopJikanManga(limit = 3) {
  const response = await axios.get("https://api.jikan.moe/v4/top/manga", {
    params: { limit },
  });
  return response.data.data || [];
}

async function getTopIGDB(limit = 3) {
  const token = await getIGDBToken();
  const response = await axios.post(
    "https://api.igdb.com/v4/games",
    `fields name,cover.url,genres.name,summary,rating,first_release_date; sort rating desc; where rating > 85 & rating_count > 500; limit ${limit};`,
    {
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
    },
  );
  return response.data || [];
}

module.exports = {
  getIGDBToken,
  searchJikanAnime,
  searchJikanManga,
  searchIGDB,
  getDetailJikan,
  getDetailIGDB,
  enrichAIResults,
  getTopJikanAnime,
  getTopJikanManga,
  getTopIGDB,
};
