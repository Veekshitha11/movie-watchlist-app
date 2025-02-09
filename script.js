document.addEventListener("DOMContentLoaded", () => {
    // Selecting necessary DOM elements
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const moviesContainer = document.getElementById("moviesContainer");
    const trendingMoviesContainer = document.getElementById("trendingMovies");
    const watchlistContainer = document.getElementById("watchlistContainer");
    const recommendedMoviesContainer = document.getElementById("recommendedMovies");
    const genreFilter = document.getElementById("genreFilter");

     // Popup elements for movie details
    const popupTitle = document.getElementById("popupTitle");
    const popupPoster = document.getElementById("popupPoster");
    const popupDetails = document.getElementById("popupDetails");
    const moviePopup = document.getElementById("moviePopup");
    const closePopup = document.getElementById("closePopup");
    const watchTrailerBtn = document.getElementById("watchTrailerBtn");

    // Trailer popup elements
    const trailerPopup = document.getElementById("trailerPopup");
    const closeTrailer = document.getElementById("closeTrailer");
    const trailerFrame = document.getElementById("trailerFrame");

     // API Keys for TMDb and OMDb
    const TMDB_API_KEY = "b5c92d5f5bcf7ab00a088eaaed4baab1";// The Movie Database API
    const OMDB_API_KEY = "2f6435d9";// OMDb API for additional movie details

     // Retrieve watchlist from local storage
    let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

     // Fetch and populate movie genres from TMDb
    async function fetchGenres() {
        const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        genreFilter.innerHTML = `<option value="">All Genres</option>`;
        data.genres.forEach(genre => {
            const option = document.createElement("option");
            option.value = genre.id;
            option.textContent = genre.name;
            genreFilter.appendChild(option);
        });
    }

    // Event listener for search button click
    searchBtn.addEventListener("click", async () => {
        let query = searchInput.value.trim();
        let selectedGenre = genreFilter.value;
        fetchMovies(query, selectedGenre);
    });

     // Event listener for genre filter change
    genreFilter.addEventListener("change", () => {
        let selectedGenre = genreFilter.value;
        let query = searchInput.value.trim();
        fetchMovies(query, selectedGenre);
    });

     // Fetch movies from TMDb API based on search query or genre filter
    async function fetchMovies(query = "", genreId = "") {
        let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}`;
        if (query) url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`;
        if (genreId) url += `&with_genres=${genreId}`;

        const res = await fetch(url);
        const data = await res.json();
        displayMovies(data.results, moviesContainer);
    }

    // Fetch trending movies from TMDb API
    async function fetchTrendingMovies() {
        const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        displayMovies(data.results, trendingMoviesContainer);
    }

    // Fetch movie trailer from TMDb API
    async function fetchMovieTrailer(movieId) {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        const trailer = data.results.find(video => video.type === "Trailer" && video.site === "YouTube");

        if (trailer) {
            trailerFrame.src = `https://www.youtube.com/embed/${trailer.key}`;
            trailerPopup.style.display = "block";
        } else {
            alert("No trailer available for this movie.");
        }
    }

    // Fetch additional movie details from OMDb API
    async function fetchOMDBDetails(movieTitle) {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieTitle)}&apikey=${OMDB_API_KEY}`);
        const data = await res.json();
        return data.Response === "True" ? data : null; 
    }

    // Display movie details in a popup
    async function showMoviePopup(movie) {
        popupTitle.textContent = movie.title;
        popupPoster.src = `https://image.tmdb.org/t/p/w300${movie.poster_path}`;
        popupDetails.innerHTML = `<p>${movie.overview || "No overview available."}</p>`;

        // Fetch and display OMDb details
        const omdbData = await fetchOMDBDetails(movie.title);
        if (omdbData) {
            popupDetails.innerHTML += `<p><strong>IMDb Rating:</strong> ${omdbData.imdbRating || "N/A"}</p>`;
            popupDetails.innerHTML += `<p><strong>Director:</strong> ${omdbData.Director || "Unknown"}</p>`;
            popupDetails.innerHTML += `<p><strong>Actors:</strong> ${omdbData.Actors || "Unknown"}</p>`;
        } else {
            popupDetails.innerHTML += `<p><strong>IMDb Rating:</strong> Not Available</p>`;
        }

        moviePopup.style.display = "block";
        watchTrailerBtn.onclick = () => fetchMovieTrailer(movie.id);
    }

     // Display a list of movies in a container
    function displayMovies(movies, container) {
        container.innerHTML = "";
        movies.forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");
            const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "no-image.jpg";
            
            movieCard.innerHTML = `
                <img src="${posterUrl}" alt="Movie Poster">
                <h3>${movie.title}</h3>
                <button class="details-btn">More Info</button>
                <button class="watchlist-btn">${watchlist.some(m => m.id === movie.id) ? "Remove from Watchlist" : "Add to Watchlist"}</button>
                <button class="trailer-btn">Watch Trailer</button>
            `;

            movieCard.querySelector(".details-btn").addEventListener("click", () => showMoviePopup(movie));
            movieCard.querySelector(".trailer-btn").addEventListener("click", () => fetchMovieTrailer(movie.id));
            movieCard.querySelector(".watchlist-btn").addEventListener("click", () => toggleWatchlist(movie));

            container.appendChild(movieCard);
        });
    }
 
   // Function to load and display the watchlist
    function loadWatchlist() {
        watchlistContainer.innerHTML = "";
        watchlist.forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie-card");
            const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "no-image.jpg";
            
            movieCard.innerHTML = `
                <img src="${posterUrl}" alt="Movie Poster">
                <h3>${movie.title}</h3>
                <button class="remove-watchlist-btn">Remove</button>
            `;
            
            movieCard.querySelector(".remove-watchlist-btn").addEventListener("click", () => toggleWatchlist(movie));
            watchlistContainer.appendChild(movieCard);
        });
        loadRecommendedMovies();
    }

    // Function to toggle movie watchlist
    function toggleWatchlist(movie) {
        const index = watchlist.findIndex(m => m.id === movie.id);
        if (index === -1) {
            watchlist.push(movie);
            showWatchlistPopup();  // Show popup only when adding
        } else {
            watchlist.splice(index, 1);
        }
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
        loadWatchlist();
    }
    
    // Function to show the popup
    function showWatchlistPopup() {
        const popup = document.getElementById("watchlistPopup");
        popup.style.display = "block";
        setTimeout(() => {
            popup.style.display = "none";
        }, 2000);
    }
    
    // Fetch recommended movies based on the watchlist
    async function loadRecommendedMovies() {
        if (!watchlist.length) {
            recommendedMoviesContainer.innerHTML = "<p>No recommendations available. Add movies to your watchlist!</p>";
            return;
        }
        let genreQuery = [...new Set(watchlist.flatMap(movie => movie.genre_ids))].join(",");
        const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreQuery}`);
        const data = await res.json();
        displayMovies(data.results, recommendedMoviesContainer);
    }

    // Close popups
    closePopup.addEventListener("click", () => moviePopup.style.display = "none");
    closeTrailer.addEventListener("click", () => { trailerPopup.style.display = "none"; trailerFrame.src = ""; });

      // Initial API calls
    fetchTrendingMovies();
    fetchGenres();
    loadWatchlist();
});
