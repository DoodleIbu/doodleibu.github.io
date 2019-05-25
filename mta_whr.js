let players = []
let ratings = []
let sets = []
let filterDays = -1;

function displayPlayerRanking() {
    let mostRecentPlayerRating = {}

    console.log(ratings);

    // There's very likely a better way to do this.
    ratings.forEach(function(rating) {
        if (!(rating["id"] in mostRecentPlayerRating)) {
            mostRecentPlayerRating["id"] = {
                "day": rating["day"],
                "rating": rating["rating"],
            }
        }

        if (mostRecentPlayerRating["id"]["day"] < rating["day"]) {
            mostRecentPlayerRating["id"] = {
                "day": rating["day"],
                "rating": rating["rating"],
            }
        }
    });

    let ranking = Object.keys(mostRecentPlayerRating).map(function(key) {
        return {
            "id": key,
            "day": mostRecentPlayerRating[key]["day"],
            "rating": mostRecentPlayerRating[key]["rating"],
        }
    });

    ranking.sort(function(first, second) {
        return second["rating"] - first["rating"];
    });

    console.log(ranking);
}

function update() {
    if (players.length == 0 || ratings.length == 0 || sets.length == 0) {
        return;
    }

    displayPlayerRanking();
}

fetch("data/player.csv").then(response => response.text()).then(text => {
    let parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    players = parsed;
    update();
});

fetch("data/rating.csv").then(response => response.text()).then(text => {
    let parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    ratings = parsed;
    update();
});

fetch("data/sets.csv").then(response => response.text()).then(text => {
    let parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    sets = parsed;
    update();
});


