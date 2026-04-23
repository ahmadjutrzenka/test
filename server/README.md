[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=23654093&assignment_repo_type=AssignmentRepo)

# Individual Project Phase 2

# Questivate API

A cross-media logging and AI recommendation server for anime, manga, and games. Users can build their collection, write reviews, and get AI-powered recommendations based on their taste.

**Live URL:** `http://your-ec2-ip:3000`

---

## Tech Stack

- **Runtime:** Node.js + Express.js v5
- **Database:** PostgreSQL + Sequelize ORM
- **Authentication:** JWT + bcryptjs (manual) · Google OAuth via `google-auth-library`
- **AI:** Google Gemini (`@google/genai`)
- **External APIs:** Jikan v4 (anime & manga) · IGDB via Twitch (games)
- **Image Storage:** Cloudinary (avatar upload)
- **Testing:** Jest + Supertest — **~97% line coverage**

---

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/ahmadjutrzenka/ip-ahmadjutrzenka-questivate.git
cd ip-ahmadjutrzenka-questivate
npm install

# 2. Create PostgreSQL databases
createdb questivate
createdb questivate_test

# 3. Copy and fill environment variables
cp .env-example .env
# → fill in all values (see Environment Variables section)

# 4. Run migrations
npx sequelize-cli db:migrate

# 5. Start server
node bin/www.js
# Server runs on http://localhost:3000

# 6. Run tests
NODE_ENV=test npx sequelize-cli db:migrate
npm test
```

---

## Environment Variables

```env
JWT_SECRET_KEY=
GOOGLE_CLIENT_ID=

IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=

GEMINI_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CLIENT_URL=http://localhost:5173
```

---

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Google login sends the Google ID token in a **request header** (not body):

```
access_token_google: <google_id_token>
```

---

## Endpoints

### Auth

#### `POST /auth/register`

Register a new local account.

**Request body:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string (min 6 chars)"
}
```

**Response `201`:**

```json
{
  "id": 1,
  "username": "ahmadjutrzenka",
  "email": "ahmad@mail.com",
  "loginMethod": "local"
}
```

**Response `400`:**

```json
{
  "message": "Email already registered via Google. Please sign in with Google."
}
```

---

#### `POST /auth/login`

Login with email and password.

**Request body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200`:**

```json
{ "access_token": "eyJhbGci..." }
```

**Response `400`:** `Email is required` / `Password is required`

**Response `401`:** `Invalid email or password` / `This account uses Google sign-in. Please sign in with Google.`

---

#### `POST /auth/google-login`

Login or register with Google. Sends the Google ID token as a **header**.

**Request header:**

```
access_token_google: <google_id_token_from_frontend>
```

**Response `200`:**

```json
{ "access_token": "eyJhbGci..." }
```

**Response `400`:** `Google token is required` / `Google email is not verified` / `Email already registered manually. Please sign in with email and password.`

---

#### `GET /auth/profile` 🔒

Get the authenticated user's own profile including Taste DNA.

**Response `200`:**

```json
{
  "user": {
    "id": 1,
    "username": "ahmadjutrzenka",
    "email": "ahmad@mail.com",
    "loginMethod": "local",
    "avatar": "https://res.cloudinary.com/your_cloud/image/upload/questivate/avatars/user_1.jpg",
    "bio": "I love dark fantasy",
    "TasteDNA": {
      "content": "Your taste gravitates toward...",
      "generatedAt": "2026-04-22T10:00:00.000Z"
    }
  }
}
```

---

#### `PATCH /auth/profile` 🔒

Update bio.

**Request body:**

```json
{ "bio": "string" }
```

**Response `200`:**

```json
{ "message": "Profile updated successfully", "bio": "Updated bio text" }
```

---

#### `PATCH /auth/profile/avatar` 🔒

Upload profile avatar to Cloudinary.

**Request:** `Content-Type: multipart/form-data`, field name: `avatar`

**Response `200`:**

```json
{
  "message": "Avatar updated successfully",
  "avatar": "https://res.cloudinary.com/your_cloud/image/upload/questivate/avatars/user_1.jpg"
}
```

---

### Users (Public)

#### `GET /users`

Search users by username.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `q` | string | Optional. Partial username search (case-insensitive) |

**Response `200`:**

```json
[{ "id": 1, "username": "ahmadjutrzenka", "avatar": "https://..." }]
```

---

#### `GET /users/:username`

Get a user's full public profile.

**Response `200`:**

```json
{
  "user": {
    "id": 1,
    "username": "ahmadjutrzenka",
    "avatar": "https://...",
    "bio": "I love dark fantasy",
    "joinedSince": "2026-04-21T00:00:00.000Z"
  },
  "stats": { "anime": 14, "manga": 9, "game": 7 },
  "favorites": [
    { "id": 3, "title": "Berserk", "coverUrl": "https://...", "mediaType": "manga", "externalId": "2" }
  ],
  "tasteDNA": {
    "content": "Your taste gravitates toward...",
    "generatedAt": "2026-04-22T10:00:00.000Z"
  },
  "collections": [...]
}
```

**Response `404`:** `User not found`

---

### Reviews (Public read, Protected write)

#### `GET /reviews/recent`

Get 20 most recently updated reviews across all users. Sorted by `updatedAt DESC`. Includes `isEdited` flag.

**Response `200`:**

```json
[
  {
    "id": 1,
    "rating": 9.5,
    "content": "Masterpiece.",
    "createdAt": "2026-04-22T08:00:00.000Z",
    "updatedAt": "2026-04-22T10:00:00.000Z",
    "isEdited": true,
    "User": { "id": 1, "username": "ahmadjutrzenka", "avatar": "https://..." },
    "Collection": {
      "id": 3,
      "title": "Berserk",
      "coverUrl": "https://...",
      "mediaType": "manga",
      "externalId": "2"
    }
  }
]
```

---

#### `GET /reviews/:id`

Get a single review by ID.

**Response `200`:** Same shape as one item from `/reviews/recent`

**Response `404`:** `Review not found`

---

#### `POST /reviews` 🔒

Create a review for a collection item. The collection item must belong to the authenticated user. One review per collection item.

**Request body:**

```json
{
  "collectionId": 3,
  "rating": 9.5,
  "content": "A brutal, beautiful masterpiece."
}
```

> At least one of `rating` or `content` must be provided.

**Response `201`:**

```json
{
  "id": 1,
  "userId": 1,
  "collectionId": 3,
  "rating": 9.5,
  "content": "A brutal, beautiful masterpiece.",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Response `400`:** `Rating or review content is required` / duplicate review (unique constraint)

**Response `403`:** `You can only review your own collection items`

**Response `404`:** `Collection item not found`

---

#### `PATCH /reviews/:id` 🔒 (owner only)

Update a review. `updatedAt` changes automatically, which triggers `isEdited: true` in responses if updated more than 60 seconds after creation.

**Request body:**

```json
{
  "rating": 10,
  "content": "Edited: even better on reread."
}
```

**Response `200`:**

```json
{
  "id": 1,
  "rating": 10,
  "content": "Edited: even better on reread.",
  "isEdited": true,
  "updatedAt": "..."
}
```

**Response `403`:** `You are not authorized`

---

#### `DELETE /reviews/:id` 🔒 (owner only)

**Response `200`:**

```json
{ "message": "Review deleted successfully" }
```

**Response `403`:** `You are not authorized`

**Response `404`:** `Review not found`

---

### Media (Public)

#### `GET /media/:type/:externalId`

Get media info from external API (Jikan or IGDB) plus all Questivate user reviews for that media.

**Params:**
| Param | Values |
|---|---|
| `type` | `anime` \| `manga` \| `game` |
| `externalId` | MAL ID (for anime/manga) or IGDB ID (for game) |

**Response `200`:**

```json
{
  "mediaInfo": {
    "mal_id": 2,
    "title": "Berserk",
    "images": { "jpg": { "image_url": "https://..." } },
    "score": 8.72,
    "genres": [{ "name": "Action" }, { "name": "Fantasy" }],
    "synopsis": "..."
  },
  "reviews": [
    {
      "id": 1,
      "rating": 9.5,
      "content": "Masterpiece.",
      "isEdited": false,
      "User": { "id": 1, "username": "ahmadjutrzenka", "avatar": "https://..." }
    }
  ]
}
```

**Response `400`:** `Type must be anime, manga, or game`

**Response `404`:** `anime not found` / `manga not found` / `game not found`

---

### Collections 🔒

All collection endpoints require authentication.

#### `GET /collections`

Get authenticated user's own collection.

**Query params:**
| Param | Values | Description |
|---|---|---|
| `type` | `anime` \| `manga` \| `game` | Optional filter |

**Response `200`:**

```json
{
  "collections": [
    {
      "id": 3,
      "userId": 1,
      "mediaType": "manga",
      "externalId": "2",
      "title": "Berserk",
      "coverUrl": "https://...",
      "genres": ["Action", "Fantasy"],
      "synopsis": "...",
      "score": 8.72,
      "status": "completed",
      "isFavorite": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

#### `POST /collections`

Add a title to the authenticated user's collection. A title with the same `externalId` and `mediaType` cannot be added twice by the same user.

**Request body:**

```json
{
  "mediaType": "manga",
  "externalId": "2",
  "title": "Berserk",
  "coverUrl": "https://...",
  "genres": ["Action", "Fantasy"],
  "synopsis": "In a dark fantasy world...",
  "score": 8.72,
  "status": "completed"
}
```

> `status` is required. Values: `plan` · `ongoing` · `completed` · `dropped`

**Response `201`:**

```json
{ "collection": { ... } }
```

**Response `400`:** `Berserk is already in your collection`

---

#### `GET /collections/:id` 🔒 (owner only)

**Response `200`:** `{ "collection": { ... } }`

**Response `403`:** `You are not authorized`

**Response `404`:** `Collection not found`

---

#### `PATCH /collections/:id` 🔒 (owner only)

Update `status` and/or `isFavorite`. Maximum 5 favorites per user.

**Request body:**

```json
{
  "status": "ongoing",
  "isFavorite": true
}
```

**Response `200`:** `{ "collection": { ... } }`

**Response `400`:** `You can only have up to 5 favorite items`

**Response `403`:** `You are not authorized`

---

#### `DELETE /collections/:id` 🔒 (owner only)

Deletes the collection item and its associated review (CASCADE).

**Response `200`:**

```json
{ "message": "Collection 3 has been deleted" }
```

---

### Search 🔒

#### `GET /search`

Search across anime, manga, game, and users. All external API calls are sequential to respect Jikan's rate limit.

**Query params:**
| Param | Required | Values | Description |
|---|---|---|---|
| `q` | Yes | string | Search query |
| `type` | No | `all` \| `anime` \| `manga` \| `game` \| `user` | Default: `all` |

**Response `200`:**

```json
{
  "anime": [
    {
      "externalId": "1535",
      "title": "Death Note",
      "coverUrl": "https://...",
      "score": 8.62,
      "genres": ["Mystery", "Psychological"],
      "synopsis": "...",
      "mediaType": "anime"
    }
  ],
  "manga": [...],
  "game": [...],
  "users": [
    { "id": 1, "username": "ahmadjutrzenka", "avatar": "https://..." }
  ]
}
```

**Response `400`:** `Query parameter 'q' is required` / `Type must be all, anime, manga, game, or user`

---

#### `GET /search/detail`

Get full detail of a single title from Jikan or IGDB. Used for the preview popup before adding to collection.

**Query params:**
| Param | Required | Values |
|---|---|---|
| `id` | Yes | MAL ID or IGDB ID |
| `type` | Yes | `anime` \| `manga` \| `game` |

**Response `200` (anime/manga):**

```json
{
  "externalId": "1535",
  "title": "Death Note",
  "coverUrl": "https://...",
  "score": 8.62,
  "genres": ["Mystery", "Psychological"],
  "synopsis": "...",
  "status": "Finished Airing",
  "mediaType": "anime",
  "episodes": 37,
  "chapters": null
}
```

**Response `200` (game):**

```json
{
  "externalId": "1942",
  "title": "Grand Theft Auto V",
  "coverUrl": "https://images.igdb.com/...",
  "score": 9.6,
  "genres": ["Adventure"],
  "synopsis": "...",
  "developers": ["Rockstar Games"],
  "mediaType": "game"
}
```

---

### AI 🔒

All AI endpoints require authentication. Response time may take 10–30 seconds due to Gemini + sequential cover fetching.

#### `POST /ai/vibe-match`

Analyze multiple titles from the user's collection and recommend new titles based on the dominant vibe.

**Request body:**

```json
{
  "referenceIds": [1, 3, 5],
  "targetMediaTypes": ["anime", "game"],
  "excludeTitles": ["Berserk", "Dark Souls"]
}
```

> `excludeTitles` is optional. Used to exclude results from a previous search in the same session.

**Response `200`:**

```json
{
  "anime": [
    {
      "title": "Vinland Saga",
      "reason": "Shares the brutal historical grounding and protagonist's journey through violence toward meaning.",
      "coverUrl": "https://...",
      "externalId": "37521"
    }
  ],
  "game": [...]
}
```

**Response `400`:** `referenceIds must be a non-empty array` / `targetMediaTypes must be a non-empty array`

**Response `404`:** `No valid reference titles found in your collection`

---

#### `POST /ai/title-match`

Find similar titles across all three media based on a single title from the collection.

**Request body:**

```json
{
  "collectionId": 3,
  "excludeTitles": []
}
```

**Response `200`:** Same shape as `/ai/vibe-match`, always returns `anime`, `manga`, and `game` keys.

**Response `400`:** `collectionId is required`

**Response `404`:** `Collection not found`

---

#### `POST /ai/taste-dna`

Generate (or regenerate) a personal taste profile based on the user's entire collection. Upserts to the TasteDNAs table.

**Request body:** `{}` (no body required)

**Response `200`:**

```json
{
  "content": "Your taste gravitates toward narratives where quiet resilience meets overwhelming odds...",
  "generatedAt": "2026-04-22T10:00:00.000Z"
}
```

**Response `400`:** `Add some titles to your collection first before generating your Taste DNA.`

---

## Error Responses

All errors follow this format:

```json
{ "message": "Error description" }
```

| Status | Name                  | Cause                                            |
| ------ | --------------------- | ------------------------------------------------ |
| `400`  | Bad Request           | Validation error, duplicate entry, invalid input |
| `401`  | Unauthorized          | Missing or invalid token                         |
| `403`  | Forbidden             | Valid token but not the resource owner           |
| `404`  | Not Found             | Resource does not exist                          |
| `500`  | Internal Server Error | Unexpected server error                          |
