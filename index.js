const searchBtn = document.getElementById("search-btn")
const searchInput = document.getElementById("search-input")
const movieList = document.getElementById("movie-list")
const emptyState = document.querySelector(".empty-state")
const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="99" height="147">
        <rect width="99" height="147" fill="#e5e7eb"/>
        <text x="50%" y="50%" fill="#9ca3af" font-size="12"
            text-anchor="middle" font-family="sans-serif">No poster</text>
    </svg>`)
const WATCHLIST_KEY = "watchlist"
let watchListFilms = []

function isInWatchlist(id) {
    const saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []
    return saved.some(f => f.imdbID === id)
}

function showErrorMessage(message){
    movieList.innerHTML=''
    emptyState.classList.add("is-error")
    emptyState.style.display = "flex"
    emptyState.querySelector("p").textContent = message
}

searchBtn.addEventListener("click",(e) =>{
    e.preventDefault()
    const query = searchInput.value.trim()
    if (!query) return
    getFilms(query)
})

async function getFilms(query){
    try{
        const res = await fetch(`https://www.omdbapi.com/?apikey=4aa0bf3f&s=${encodeURIComponent(query)}`)
        const data = await res.json()
        if(data.Response === "False"){
            console.log(data.Error)
            showErrorMessage("Unable to find what you’re looking for. Please try another search.")
            return
        }
        const detailedFilms = await getFilmDetails(data.Search)
        renderResult(detailedFilms)
    }catch (err){
        console.log("something went wrong", err)
        showErrorMessage("Something went wrong. Please try again.")
    }
}

async function getFilmDetails(films){
    return Promise.all(
        films.map(async (film) =>{
            const res = await fetch(`https://www.omdbapi.com/?apikey=4aa0bf3f&i=${film.imdbID}`)
            return res.json()
        })
    )
}

function renderResult(films){
    watchListFilms = films
    emptyState.classList.remove("is-error")
    emptyState.querySelector("p").textContent = "Start exploring"
    emptyState.style.display = "none"
    movieList.innerHTML = films.map(film => {
        const plot = film.Plot !== "N/A" ? film.Plot : "No plot available."
        const isLong = plot.length > 130
        const shortPlot = isLong ? plot.slice(0, 130).trim() + "..." : plot
        const saved = isInWatchlist(film.imdbID)

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
                        <i class="fa-solid ${saved ? "fa-circle-minus" : "fa-circle-plus"}"></i>
                        ${saved ? "Remove" : "Watchlist"}
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

movieList.addEventListener("click", (e) => {
    const btn = e.target.closest(".watchlist-btn")

    if (e.target.classList.contains("read-more-btn")) {
        const plot = e.target.closest(".movie-plot")
        plot.querySelector(".plot-short").hidden = true
        plot.querySelector(".plot-full").hidden = false
        e.target.remove()
    }

    if (btn) {
        const film = watchListFilms.find(f => f.imdbID === btn.dataset.id)
        if (!film) return

        let saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []

        if (saved.some(f => f.imdbID === film.imdbID)) {
            saved = saved.filter(f => f.imdbID !== film.imdbID)
            btn.innerHTML = `<i class="fa-solid fa-circle-plus"></i> Watchlist`
        } else {
            saved.push(film)
            btn.innerHTML = `<i class="fa-solid fa-circle-minus"></i> Remove`
        }

        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(saved))
    }
})

movieList.addEventListener("error", (e) => {
    if (e.target.classList.contains("movie-poster")) {
        e.target.onerror = null
        e.target.src = PLACEHOLDER
    }
}, true)