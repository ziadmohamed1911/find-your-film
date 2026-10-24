/* ---------- Config ---------- */
const API_KEY = "4aa0bf3f"
const API_URL = "https://www.omdbapi.com/"
const WATCHLIST_KEY = "watchlist"
const PLOT_PREVIEW_LENGTH = 130

const NOT_FOUND_MESSAGE = "Unable to find what you’re looking for. Please try another search."
const ERROR_MESSAGE = "Something went wrong. Please try again."

const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="99" height="147">
        <rect width="99" height="147" fill="#e5e7eb"/>
        <text x="50%" y="50%" fill="#9ca3af" font-size="12"
            text-anchor="middle" font-family="sans-serif">No poster</text>
    </svg>`)

/* ---------- DOM ---------- */
const searchForm = document.querySelector(".search-form")
const searchInput = document.getElementById("search-input")
const movieList = document.getElementById("movie-list")
const emptyState = document.querySelector(".empty-state")
const emptyStateText = emptyState.querySelector("p")

/* ---------- State ---------- */
let currentFilms = []

/* ---------- Watchlist storage ---------- */
function getWatchlist() {
    try {
        return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []
    } catch {
        return []
    }
}

function saveWatchlist(list) {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list))
}

// Adds the film if it isn't saved, removes it if it is. Returns the new saved state.
function toggleWatchlist(film) {
    const list = getWatchlist()
    const isSaved = list.some(f => f.imdbID === film.imdbID)

    saveWatchlist(
        isSaved
            ? list.filter(f => f.imdbID !== film.imdbID)
            : [...list, film]
    )
    return !isSaved
}

/* ---------- API ---------- */
async function fetchOmdb(params) {
    const query = new URLSearchParams({ apikey: API_KEY, ...params })
    const res = await fetch(`${API_URL}?${query}`)
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
    return res.json()
}

async function searchFilms(query) {
    const data = await fetchOmdb({ s: query })

    if (data.Response === "False") {
        console.log(data.Error)
        return []
    }
    return data.Search
}

function getFilmDetails(films) {
    return Promise.all(films.map(film => fetchOmdb({ i: film.imdbID })))
}

/* ---------- Helpers ---------- */
const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, char => HTML_ESCAPES[char])
}

// OMDb returns the string "N/A" for missing values
function hasValue(value) {
    return Boolean(value) && value !== "N/A"
}

function watchlistButtonContent(isSaved) {
    return isSaved
        ? `<i class="fa-solid fa-circle-minus"></i> Remove`
        : `<i class="fa-solid fa-circle-plus"></i> Watchlist`
}

/* ---------- Rendering ---------- */
function showEmptyState(message, isError = false) {
    movieList.innerHTML = ""
    emptyState.classList.toggle("is-error", isError)
    emptyStateText.textContent = message
    emptyState.hidden = false
}

function createFilmCard(film, isSaved) {
    const title = escapeHtml(film.Title)
    const poster = escapeHtml(hasValue(film.Poster) ? film.Poster : PLACEHOLDER)
    const rating = hasValue(film.imdbRating) ? film.imdbRating : "-"
    const plot = hasValue(film.Plot) ? film.Plot : "No plot available."

    const isLong = plot.length > PLOT_PREVIEW_LENGTH
    const preview = isLong ? `${plot.slice(0, PLOT_PREVIEW_LENGTH).trim()}...` : plot

    return `
        <div class="movie-card">
            <img class="movie-poster" src="${poster}" alt="${title} poster">
            <div class="movie-info">
                <div class="movie-header">
                    <h3 class="movie-title">${title}</h3>
                    <p class="movie-rating">
                        <i class="fa-solid fa-star"></i>
                        ${escapeHtml(rating)}
                    </p>
                </div>
                <div class="movie-meta">
                    <span class="movie-runtime">${escapeHtml(film.Runtime)}</span>
                    <span class="movie-genre">${escapeHtml(film.Genre)}</span>
                    <button class="watchlist-btn" type="button" data-id="${escapeHtml(film.imdbID)}">
                        ${watchlistButtonContent(isSaved)}
                    </button>
                </div>
                <p class="movie-plot">
                    <span class="plot-short">${escapeHtml(preview)}</span>
                    <span class="plot-full" hidden>${escapeHtml(plot)}</span>
                    ${isLong ? `<button class="read-more-btn" type="button">Read more</button>` : ""}
                </p>
            </div>
        </div>
    `
}

function renderFilms(films) {
    currentFilms = films
    const savedIds = new Set(getWatchlist().map(film => film.imdbID))

    emptyState.hidden = true
    movieList.innerHTML = films
        .map(film => createFilmCard(film, savedIds.has(film.imdbID)))
        .join("")
}

/* ---------- Search flow ---------- */
async function handleSearch(query) {
    try {
        const results = await searchFilms(query)

        if (results.length === 0) {
            showEmptyState(NOT_FOUND_MESSAGE, true)
            return
        }

        renderFilms(await getFilmDetails(results))
    } catch (err) {
        console.log("something went wrong", err)
        showEmptyState(ERROR_MESSAGE, true)
    }
}

/* ---------- Event handlers ---------- */
function expandPlot(readMoreBtn) {
    const plot = readMoreBtn.closest(".movie-plot")
    plot.querySelector(".plot-short").hidden = true
    plot.querySelector(".plot-full").hidden = false
    readMoreBtn.remove()
}

function handleWatchlistClick(btn) {
    const film = currentFilms.find(f => f.imdbID === btn.dataset.id)
    if (!film) return

    btn.innerHTML = watchlistButtonContent(toggleWatchlist(film))
}

searchForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const query = searchInput.value.trim()
    if (query) handleSearch(query)
})

movieList.addEventListener("click", (e) => {
    const readMoreBtn = e.target.closest(".read-more-btn")
    if (readMoreBtn) return expandPlot(readMoreBtn)

    const watchlistBtn = e.target.closest(".watchlist-btn")
    if (watchlistBtn) handleWatchlistClick(watchlistBtn)
})

// "error" events don't bubble, so listen in the capture phase
movieList.addEventListener("error", (e) => {
    if (e.target.classList.contains("movie-poster")) {
        e.target.onerror = null
        e.target.src = PLACEHOLDER
    }
}, true)