const movieList = document.getElementById("movie-list")
const emptyState = document.querySelector(".empty-state")
const WATCHLIST_KEY = "watchlist"
const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="99" height="147">
        <rect width="99" height="147" fill="#e5e7eb"/>
        <text x="50%" y="50%" fill="#9ca3af" font-size="12"
            text-anchor="middle" font-family="sans-serif">No poster</text>
    </svg>`)



function getWatchList() {
    try{
       return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []
    } catch{
        return []
    }
}

function renderWatchlist() {
    const films = getWatchList()
    emptyState.hidden = films.length > 0

    movieList.innerHTML = films.map(film => {
        const plot = film.Plot !== "N/A" ? film.Plot : "No plot available."
        const isLong = plot.length > 130
        const shortPlot = isLong ? plot.slice(0, 130).trim() + "..." : plot

        return `
        <div class="movie-card">
            <img class="movie-poster"
                 src="${film.Poster !== "N/A" ? film.Poster : PLACEHOLDER}"
                 alt="${film.Title} poster">
            <div class="movie-info">
                <div class="movie-header">
                    <h3 class="movie-title">${film.Title}</h3>
                    <p class="movie-rating">
                        <i class="fa-solid fa-star"></i>
                        ${film.imdbRating !== "N/A" ? film.imdbRating : "-"}
                    </p>
                </div>
                <div class="movie-meta">
                    <span class="movie-runtime">${film.Runtime}</span>
                    <span class="movie-genre">${film.Genre}</span>
                    <button class="watchlist-btn" type="button" data-id="${film.imdbID}">
                        <i class="fa-solid fa-circle-minus"></i>
                        Remove
                    </button>
                </div>
                <p class="movie-plot">
                    <span class="plot-short">${shortPlot}</span>
                    <span class="plot-full" hidden>${plot}</span>
                    ${isLong ? `<button class="read-more-btn" type="button">Read more</button>` : ""}
                </p>
            </div>
        </div>
        `
    }).join("")
}


movieList.addEventListener("click" ,(e) => {
    const btn = e.target.closest(".watchlist-btn")
    if(e.target.classList.contains("read-more-btn")){
        const plot = e.target.closest(".movie-plot")
        plot.querySelector(".plot-short").hidden = true
        plot.querySelector(".plot-full").hidden = false
        e.target.remove()
    }

    if (btn) {
        const updated = getWatchList().filter(f => f.imdbID !== btn.dataset.id)
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated))
        renderWatchlist()
    }
})

movieList.addEventListener("error", (e) => {
    if (e.target.classList.contains("movie-poster")) {
        e.target.onerror = null
        e.target.src = PLACEHOLDER
    }
}, true)

renderWatchlist()