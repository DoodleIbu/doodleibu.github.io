const RATING_FUDGE = 1000;
const MTA_RELEASE_DATE = new Date(2018, 5, 22);

let players = {};
let events = {};
let sets = [];
let ratings = [];

// Use test data if run locally.
if (location.hostname === "") {
    players = {"S123": "test", "S456": "test2"};
    events = {"S123456": "shining finger sword"};
    sets = [
        {"player1_id": "S123", "player2_id": "S456", "day": 1, "winner": "B", "event_id": "S123456"},
        {"player1_id": "S123", "player2_id": "S456", "day": 2, "winner": "B", "event_id": "S123456"},
    ];
    ratings = [
        {"player_id": "S123", "day": 1, "rating": 20},
        {"player_id": "S456", "day": 1, "rating": -20},
        {"player_id": "S123", "day": 2, "rating": 40},
        {"player_id": "S456", "day": 2, "rating": -40},
    ];
}

// Get the calendar date given the "days since MTA release".
function getDate(days) {
    let date = new Date(MTA_RELEASE_DATE.getTime());
    date.setDate(date.getDate() + days);
    return date;
}

/*  ===============
    Player rankings
    ===============
 */
function displayPlayerRankings(filterDays) {
    let mostRecentPlayerRating = {}

    let currentDate = new Date();
    let oneDay = 24 * 60 * 60 * 1000;
    let daysSinceRelease = Math.round(Math.abs((currentDate.getTime() - MTA_RELEASE_DATE.getTime()) / oneDay));

    // Filter out ratings that occur before daysSinceRelease - filterDays.
    let daysThreshold = daysSinceRelease - filterDays;

    // There should be a better way to do this, but laziness.
    ratings.forEach(function(rating) {
        if (filterDays === -1 || rating["day"] >= daysThreshold) {
            if (!(rating["player_id"] in mostRecentPlayerRating)) {
                mostRecentPlayerRating[rating["player_id"]] = {
                    "day": rating["day"],
                    "rating": rating["rating"],
                }
            }

            if (mostRecentPlayerRating[rating["player_id"]]["day"] < rating["day"]) {
                mostRecentPlayerRating[rating["player_id"]] = {
                    "day": rating["day"],
                    "rating": rating["rating"],
                }
            }
        }
    });

    let rankings = Object.keys(mostRecentPlayerRating).map(function(key) {
        return {
            "player_id": key,
            "day": mostRecentPlayerRating[key]["day"],
            "rating": mostRecentPlayerRating[key]["rating"],
        }
    });

    rankings.sort(function(first, second) {
        return second["rating"] - first["rating"];
    });

    // Display rankings.
    $(".player-rankings-list .player-rank").remove();
    rankings.forEach(function(rank, index) {
        $(".player-rankings-list").append(
            "<tr class='player-rank'>" +
                "<td>" + (index + 1) + "</td>" +
                "<td><a class='player-rating-history-link' href='#player-rating-history' data-playerid='" + rank["player_id"] + "'>" +
                    players[rank["player_id"]] + "</a></td>" +
                "<td>" + Math.round(rank["rating"]) + "</td>" +
            "</tr>"
        );
    });
}

$(".player-rankings-filter-button").on("click", function() {
    filterDays = $(".player-rankings-filter-days-input").val();
    displayPlayerRankings(filterDays);
});

$(".player-rankings-list").on("click", ".player-rating-history-link", function(event) {
    let selectedPlayerId = parseInt($(event.target).data("playerid"));
    $(".player-select").val(selectedPlayerId);
    displayPlayerRatingHistory();
});

/*  =====================
    Player rating history
    =====================
 */
function populatePlayerDropdown() {
    sortedPlayers = Object.keys(players).sort(function(first, second) {
        let firstName = players[first].toUpperCase();
        let secondName = players[second].toUpperCase();
        return (firstName < secondName) ? -1 : (firstName > secondName) ? 1 : 0;
    });

    sortedPlayers.forEach(function(key) {
        $(".player-select").append("<option value='" + key + "'>" + players[key] + "</option>");
    });
}

function getPlayerDropdownValue() {
    return $(".player-select").val();
}

function displayPlayerSets() {
    $(".player-sets .player-set").remove();

    let playerId = getPlayerDropdownValue();
    if (playerId === -1) {
        return;
    }

    playerSets = []
    sets.forEach(function(set) {
        if (set["player1_id"] === playerId || set["player2_id"] === playerId) {
            playerSets.push(set);
        }
    });

    playerSets.sort(function(first, second) {
        return second["day"] - first["day"];
    });

    playerSets.forEach(function(set) {
        let winnerName;
        let setRating;

        if (set["winner"] === "B") {
            winnerName = players[set["player1_id"]];
        } else {
            winnerName = players[set["player2_id"]];
        }

        setDate = getDate(set["day"]);
        let setDateString = setDate.getFullYear() + "-" + (setDate.getMonth() + 1) + "-" +
                            setDate.getDate();

        // TODO: This is slow, but at this point we don't have many games...
        setRating = ratings.find(function(rating) {
            return rating["player_id"] === playerId && rating["day"] === set["day"];
        })["rating"];

        $(".player-sets").append(
            "<tr class='player-set'>" +
                "<td>" + players[set["player1_id"]] + "</td>" +
                "<td>" + players[set["player2_id"]] + "</td>" +
                "<td>" + winnerName + "</td>" +
                "<td>" + events[set["event_id"]] + "</td>" +
                "<td>" + setDateString + "</td>" +
                "<td>" + Math.round(setRating) + "</td>" +
            "</tr>"
        );
    });
}

// Define instance of the rating graph so we can destroy it.
let ratingGraph = undefined;

function displayPlayerRatingGraph() {

    $(".player-rating-history-graph").hide();
    if (ratingGraph != undefined) {
        ratingGraph.destroy();
    }

    let playerId = getPlayerDropdownValue();
    if (playerId === -1) {
        return;
    }

    let playerRatings = ratings.filter(function(rating) {
        return rating["player_id"] === playerId;
    });

    let labels = [];
    let datapoints = [];
    playerRatings.forEach(function(rating) {
        labels.push(getDate(rating["day"]));
        datapoints.push(
            {
                x: getDate(rating["day"]),
                y: Math.round(rating["rating"]),
            }
        );
    });

    let data = {
        labels: labels,
        datasets: [
            {
                fill: false,
                data: datapoints,
                borderColor: "rgba(0, 0, 255, 0.5)",
                backgroundColor: "rgba(0, 0, 255, 0.5)",
                pointBorderColor: "rgba(0, 0, 255, 0.5)",
                pointBackgroundColor: "rgba(0, 0, 255, 0.5)",
            }
        ]
    }

    let options = {
        responsive: false,
        title: {
            text: "Player Rating over Time",
            display: true,
        },
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    parser: "YYYY-MM-DD",
                    tooltipFormat: "ll"
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Date'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Rating'
                }
            }]
        },
        legend: {
            display: false
        },
    }

    $(".player-rating-history-graph").prop({ width: 640, height: 320 });
    let ctx = $(".player-rating-history-graph")[0].getContext("2d");
    ratingGraph = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options,
    });

    $(".player-rating-history-graph").show();
}

function displayPlayerRatingHistory() {
    displayPlayerSets();
    displayPlayerRatingGraph();
}

$(".player-select").on("change", displayPlayerRatingHistory);

/*  =========
    Hydration
    =========
*/
function initialLoad() {
    if (Object.keys(players).length === 0 || Object.keys(events).length === 0 || 
        ratings.length === 0 || sets.length === 0) {
        return;
    }

    populatePlayerDropdown();
    displayPlayerRankings(-1);
}

initialLoad();

fetch("data/players.csv").then(response => response.text()).then(text => {
    let parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    players = parsed["data"].reduce(function(map, obj) {
        map[obj["id"]] = obj["name"];
        return map;
    }, {});
    initialLoad();
});

fetch("data/events.csv").then(response => response.text()).then(text => {
    let parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    events = parsed["data"].reduce(function(map, obj) {
        map[obj["id"]] = obj["name"];
        return map;
    }, {});
    initialLoad();
});

fetch("data/sets.csv").then(response => response.text()).then(text => {
    let parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    sets = parsed["data"];
    initialLoad();
});

fetch("data/ratings.csv").then(response => response.text()).then(text => {
    let parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    ratings = parsed["data"];

    // Fudge ratings to be 1000 higher.
    ratings.forEach(function(rating) {
        rating["rating"] += RATING_FUDGE;
    });

    initialLoad();
});
