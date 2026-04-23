const request = require("supertest");
const app = require("../app");
const { sequelize, User } = require("../models");
const { signToken } = require("../helpers/jwt");
const { OAuth2Client } = require("google-auth-library");
const cloudinary = require("cloudinary").v2;

jest.mock("google-auth-library", () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: "googleuser@gmail.com",
          email_verified: true,
          name: "Google User",
          picture: "https://photo.url/pic.jpg",
        }),
      }),
    })),
  };
});

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

// ─── POST /auth/register ───────────────────────────────────────────────────
describe("POST /auth/register", () => {
  it("201 — register berhasil", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "testuser",
      email: "test@mail.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("username", "testuser");
    expect(res.body).toHaveProperty("loginMethod", "local");
    expect(res.body).not.toHaveProperty("password");
  });

  it("400 — email sudah dipakai", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "anotheruser",
      email: "test@mail.com",
      password: "password123",
    });
    expect(res.status).toBe(400);
  });

  it("400 — email sudah terdaftar via Google", async () => {
    // Buat user Google dulu langsung di DB
    await User.create({
      username: "googleonly",
      email: "google@mail.com",
      password: null,
      loginMethod: "google",
    });
    const res = await request(app).post("/auth/register").send({
      username: "trylocal",
      email: "google@mail.com",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/google/i);
  });

  it("400 — password kurang dari 6 karakter", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "shortpass",
      email: "short@mail.com",
      password: "123",
    });
    expect(res.status).toBe(400);
  });
});

// ─── POST /auth/login ──────────────────────────────────────────────────────
describe("POST /auth/login", () => {
  it("200 — login berhasil", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "test@mail.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("access_token");
  });

  it("400 — email tidak dikirim", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ password: "password123" });
    expect(res.status).toBe(400);
  });

  it("400 — password tidak dikirim", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@mail.com" });
    expect(res.status).toBe(400);
  });

  it("401 — email tidak ditemukan", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "notexist@mail.com",
      password: "password123",
    });
    expect(res.status).toBe(401);
  });

  it("401 — password salah", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "test@mail.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("401 — akun Google mencoba login manual", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "google@mail.com",
      password: "anypassword",
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/google/i);
  });
});

// ─── POST /auth/google-login ───────────────────────────────────────────────
describe("POST /auth/google-login", () => {
  it("200 — google login berhasil, user baru dibuat", async () => {
    const res = await request(app)
      .post("/auth/google-login")
      .set("access_token_google", "fake-google-token");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("access_token");
  });

  it("200 — google login berhasil, user sudah ada (findOrCreate)", async () => {
    // Dipanggil lagi dengan email yang sama → find, bukan create
    const res = await request(app)
      .post("/auth/google-login")
      .set("access_token_google", "fake-google-token");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("access_token");
  });

  it("400 — tanpa google token di header", async () => {
    const res = await request(app).post("/auth/google-login");
    expect(res.status).toBe(400);
  });

  it("400 — email Google tidak terverifikasi", async () => {
    OAuth2Client.mockImplementationOnce(() => ({
      verifyIdToken: jest.fn().mockResolvedValue({
        getPayload: () => ({
          email: "unverified@mail.com",
          email_verified: false,
          name: "Unverified",
        }),
      }),
    }));

    const res = await request(app)
      .post("/auth/google-login")
      .set("access_token_google", "fake-google-token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/verified/i);
  });
});

// ─── GET /auth/profile ─────────────────────────────────────────────────────
describe("GET /auth/profile", () => {
  let token;

  beforeAll(async () => {
    const user = await User.findOne({ where: { email: "test@mail.com" } });
    token = signToken({ id: user.id, email: user.email });
  });

  it("200 — berhasil ambil profil", async () => {
    const res = await request(app)
      .get("/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("email", "test@mail.com");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("401 — tanpa token", async () => {
    const res = await request(app).get("/auth/profile");
    expect(res.status).toBe(401);
  });

  it("401 — token tidak valid", async () => {
    const res = await request(app)
      .get("/auth/profile")
      .set("Authorization", "Bearer invalidtoken123");
    expect(res.status).toBe(401);
  });

  it("401 — format authorization bukan Bearer", async () => {
    const res = await request(app)
      .get("/auth/profile")
      .set("Authorization", "Basic abc123");
    expect(res.status).toBe(401);
  });

  it("401 — Bearer tanpa token", async () => {
    const res = await request(app)
      .get("/auth/profile")
      .set("Authorization", "Bearer");
    expect(res.status).toBe(401);
  });

  it("401 — token valid tapi user tidak ditemukan", async () => {
    const ghostToken = signToken({ id: 999999, email: "ghost@mail.com" });
    const res = await request(app)
      .get("/auth/profile")
      .set("Authorization", `Bearer ${ghostToken}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /auth/profile ───────────────────────────────────────────────────
describe("PATCH /auth/profile", () => {
  let token;

  beforeAll(async () => {
    const user = await User.findOne({ where: { email: "test@mail.com" } });
    token = signToken({ id: user.id, email: user.email });
  });

  it("200 — update bio berhasil", async () => {
    const res = await request(app)
      .patch("/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ bio: "I love anime and games" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("bio", "I love anime and games");
  });

  it("501 — update avatar belum diimplementasikan", async () => {
    const res = await request(app)
      .patch("/auth/profile/avatar")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/avatar image is required/i);
  });

  it("200 — update avatar berhasil", async () => {
    jest.spyOn(cloudinary.uploader, "upload").mockResolvedValueOnce({
      secure_url: "https://res.cloudinary.com/demo/image/upload/v1/avatar.png",
    });

    const res = await request(app)
      .patch("/auth/profile/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", Buffer.from("fake-image"), "avatar.png");

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/avatar updated successfully/i);
    expect(res.body.avatar).toMatch(/^https:\/\//);
  });
});
