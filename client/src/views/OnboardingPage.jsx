import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import axios from "axios";
import { BASE_URL } from "../constants/url";
import { searchMedia } from "../features/search/searchSlice";
import { addToCollection } from "../features/collection/collectionSlice";

const SEARCH_TYPES = ["all", "anime", "manga", "game"];

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <polyline points="3,8 6.5,12 13,4" />
  </svg>
);

function SkeletonCard() {
  return (
    <div className="popular-skeleton">
      <div className="skeleton-cover" />
      <div className="skeleton-info">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}

function PopularCard({ item, selected, onToggle }) {
  return (
    <div
      className={`popular-card ${selected ? "selected" : ""}`}
      onClick={() => onToggle(item)}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => e.key === " " && onToggle(item)}
    >
      {item.coverUrl ? (
        <img
          className="popular-card-cover"
          src={item.coverUrl}
          alt={item.title}
          loading="lazy"
        />
      ) : (
        <div className="popular-card-cover-placeholder">No image</div>
      )}
      <div className="popular-card-check">
        <CheckIcon />
      </div>
      <div className="popular-card-info">
        <p className="popular-card-title">{item.title}</p>
        <div className="popular-card-meta">
          {item.score != null && (
            <span className="popular-card-score">★ {item.score}</span>
          )}
        </div>
        {item.genres?.length > 0 && (
          <p className="popular-card-genres">
            {item.genres.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function ResultCard({ item, selected, onToggle }) {
  return (
    <div
      className={`result-card ${selected ? "selected" : ""}`}
      onClick={() => onToggle(item)}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => e.key === " " && onToggle(item)}
    >
      <img
        className="result-card-cover"
        src={
          item.coverUrl ||
          `https://placehold.co/40x56/1e1e2a/7c7a8a?text=${item.mediaType}`
        }
        alt={item.title}
        loading="lazy"
      />
      <div className="result-card-body">
        <p className="result-card-title">{item.title}</p>
        <p className="result-card-meta">
          {item.score != null ? `★ ${item.score}` : ""}
          {item.score != null && item.genres?.length > 0 ? " · " : ""}
          {item.genres?.slice(0, 2).join(", ")}
        </p>
      </div>
      <div className="result-card-check">
        <CheckIcon />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { results, loading: searchLoading } = useSelector((s) => s.search);

  const [popular, setPopular] = useState({ anime: [], manga: [], game: [] });
  const [popularLoading, setPopularLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [q, setQ] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [hasSearched, setHasSearched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem("new_registration");

    const fetchPopular = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const { data } = await axios.get(`${BASE_URL}/search/popular`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPopular(data);
      } catch (err) {
        console.error("Failed to fetch popular:", err);
      } finally {
        setPopularLoading(false);
      }
    };
    fetchPopular();
  }, []);

  const isSelected = (item) =>
    selected.some(
      (s) =>
        s.externalId === String(item.externalId) &&
        s.mediaType === item.mediaType,
    );

  const toggleSelect = (item) => {
    const norm = { ...item, externalId: String(item.externalId) };
    setSelected((prev) => {
      const exists = prev.some(
        (s) =>
          s.externalId === norm.externalId && s.mediaType === norm.mediaType,
      );
      if (exists)
        return prev.filter(
          (s) =>
            !(
              s.externalId === norm.externalId && s.mediaType === norm.mediaType
            ),
        );
      return [...prev, norm];
    });
  };

  const removeSelected = (item) => {
    setSelected((prev) =>
      prev.filter(
        (s) =>
          !(s.externalId === item.externalId && s.mediaType === item.mediaType),
      ),
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    dispatch(searchMedia(q.trim(), searchType));
    setHasSearched(true);
  };

  const handleContinue = async () => {
    if (selected.length < 3 || submitting) return;
    setSubmitting(true);
    for (const item of selected) {
      await dispatch(
        addToCollection({
          mediaType: item.mediaType,
          externalId: String(item.externalId),
          title: item.title,
          coverUrl: item.coverUrl || null,
          genres: item.genres || [],
          synopsis: item.synopsis || null,
          score: item.score || null,
          status: "plan",
        }),
      );
    }
    navigate("/");
  };

  const canContinue = selected.length >= 3;
  const mediaTypes = ["anime", "manga", "game"];

  const mediaLabel = { anime: "Anime", manga: "Manga", game: "Game" };
  const mediaBadge = {
    anime: "badge badge-anime",
    manga: "badge badge-manga",
    game: "badge badge-game",
  };

  const searchResultsToShow = mediaTypes.filter(
    (t) => searchType === "all" || searchType === t,
  );

  return (
    <div className="onboarding-page">
      <div className="onboarding-inner">
        {/* Header */}
        <div className="onboarding-header">
          <p className="onboarding-eyebrow">Welcome to Questivate</p>
          <h1 className="onboarding-title">
            Select at least 3 titles to start your collection
          </h1>
          <p className="onboarding-subtitle">
            Add anime, manga, or games you like. This will be the seed of your
            collection and you can always add more later.
          </p>

          {/* Progress dots */}
          <div className="onboarding-progress">
            <div className="progress-dots">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`progress-dot ${
                    i < selected.length
                      ? selected.length > 3
                        ? "extra"
                        : "filled"
                      : ""
                  }`}
                />
              ))}
            </div>
            <p className="progress-label">
              <span>{selected.length}</span> / 3 selected
            </p>
          </div>
        </div>

        {/* Popular Anime */}
        <div className="onboarding-section">
          <div className="onboarding-section-header">
            <h2 className="onboarding-section-title">Popular Anime</h2>
            <span className="badge badge-anime">Anime</span>
          </div>
          <div className="popular-grid">
            {popularLoading
              ? [1, 2, 3].map((n) => <SkeletonCard key={n} />)
              : popular.anime.map((item) => (
                  <PopularCard
                    key={item.externalId}
                    item={item}
                    selected={isSelected(item)}
                    onToggle={toggleSelect}
                  />
                ))}
          </div>
        </div>

        {/* Popular Manga */}
        <div className="onboarding-section">
          <div className="onboarding-section-header">
            <h2 className="onboarding-section-title">Popular Manga</h2>
            <span className="badge badge-manga">Manga</span>
          </div>
          <div className="popular-grid">
            {popularLoading
              ? [1, 2, 3].map((n) => <SkeletonCard key={n} />)
              : popular.manga.map((item) => (
                  <PopularCard
                    key={item.externalId}
                    item={item}
                    selected={isSelected(item)}
                    onToggle={toggleSelect}
                  />
                ))}
          </div>
        </div>

        {/* Popular Games */}
        <div className="onboarding-section">
          <div className="onboarding-section-header">
            <h2 className="onboarding-section-title">Popular Games</h2>
            <span className="badge badge-game">Game</span>
          </div>
          <div className="popular-grid">
            {popularLoading
              ? [1, 2, 3].map((n) => <SkeletonCard key={n} />)
              : popular.game.map((item) => (
                  <PopularCard
                    key={item.externalId}
                    item={item}
                    selected={isSelected(item)}
                    onToggle={toggleSelect}
                  />
                ))}
          </div>
        </div>

        {/* Divider */}
        <div className="onboarding-divider">or find your own</div>

        {/* Search section */}
        <div className="onboarding-search-section">
          <p className="onboarding-search-label">
            Can't find your favorite? Find it here.
          </p>
          <form className="onboarding-search-form" onSubmit={handleSearch}>
            <input
              className="input onboarding-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find anime, manga, or games…"
            />
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={searchLoading || !q.trim()}
            >
              {searchLoading ? "Searching…" : "Search"}
            </button>
          </form>

          {/* Type tabs */}
          <div className="onboarding-type-tabs">
            {SEARCH_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`type-tab ${searchType === t ? "active" : ""}`}
                onClick={() => setSearchType(t)}
              >
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Search results */}
          {hasSearched && (
            <div className="onboarding-search-results">
              {searchResultsToShow.map((mt) => {
                const list = results[mt] || [];
                if (list.length === 0) return null;
                return (
                  <div className="onboarding-results-section" key={mt}>
                    <p className="onboarding-results-title">
                      <span className={mediaBadge[mt]}>{mediaLabel[mt]}</span>
                    </p>
                    <div className="onboarding-results-grid">
                      {list.slice(0, 6).map((item) => (
                        <ResultCard
                          key={item.externalId}
                          item={item}
                          selected={isSelected(item)}
                          onToggle={toggleSelect}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {searchResultsToShow.every(
                (mt) => (results[mt] || []).length === 0,
              ) &&
                !searchLoading && (
                  <p className="onboarding-no-results">No results found.</p>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="onboarding-bottom-bar">
        <div className="onboarding-bottom-info">
          <p className="onboarding-count">{selected.length} selected</p>
          {!canContinue && (
            <p className="onboarding-count-hint">
              Pick {3 - selected.length} more to continue
            </p>
          )}
        </div>

        {/* Selected chips (show up to 3) */}
        {selected.length > 0 && (
          <div className="onboarding-selected-chips">
            {selected.slice(0, 3).map((item) => (
              <div
                key={`${item.mediaType}-${item.externalId}`}
                className="selected-chip"
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.title}
                </span>
                <button
                  className="selected-chip-remove"
                  onClick={() => removeSelected(item)}
                  aria-label={`Remove ${item.title}`}
                >
                  ×
                </button>
              </div>
            ))}
            {selected.length > 3 && (
              <div className="selected-chip">+{selected.length - 3} more</div>
            )}
          </div>
        )}

        <button
          className="btn-continue"
          disabled={!canContinue || submitting}
          onClick={handleContinue}
        >
          {submitting ? (
            <>
              <span className="btn-continue-spinner" />
              Saving…
            </>
          ) : (
            "Continue to Dashboard →"
          )}
        </button>
      </div>
    </div>
  );
}
