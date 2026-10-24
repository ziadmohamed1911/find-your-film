/* ---------- Config ---------- */
const WATCHLIST_KEY = "watchlist"
const PLOT_PREVIEW_LENGTH = 130

const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="99" height="147">
        <rect width="99" height="147" fill="#e5e7eb"/>
        <text x="50%" y="50%" fill="#9ca3af" font-size="12"
            text-anchor="middle" font-family="sans-serif">No poster</text>
    </svg>`)

/* ---------- DOM ---------- */
const movieList = document.getElementById("movie-list")
const emptyState = document.querySelector(".empty-state")

/* ---------- Watchlist storage ---------- */
function getWatchlist() {
    try {
        return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []
    } catch {
        return []
    }
}

function removeFromWatchlist(id) {
    const updated = getWatchlist().filter(film => film.imdbID !== id)
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated))
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

/* ---------- Rendering ---------- */
function createFilmCard(film) {
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
                        <i class="fa-solid fa-circle-minus"></i>
                        Remove
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

function renderWatchlist() {
    const films = getWatchlist()

    emptyState.hidden = films.length > 0
    movieList.innerHTML = films.map(createFilmCard).join("")
}

/* ---------- Event handlers ---------- */
function expandPlot(readMoreBtn) {
    const plot = readMoreBtn.closest(".movie-plot")
    plot.querySelector(".plot-short").hidden = true
    plot.querySelector(".plot-full").hidden = false
    readMoreBtn.remove()
}

movieList.addEventListener("click", (e) => {
    const readMoreBtn = e.target.closest(".read-more-btn")
    if (readMoreBtn) return expandPlot(readMoreBtn)

    const removeBtn = e.target.closest(".watchlist-btn")
    if (removeBtn) {
        removeFromWatchlist(removeBtn.dataset.id)
        renderWatchlist()
    }
})

// "error" events don't bubble, so listen in the capture phase
movieList.addEventListener("error", (e) => {
    if (e.target.classList.contains("movie-poster")) {
        e.target.onerror = null
        e.target.src = PLACEHOLDER
    }
}, true)

renderWatchlist()