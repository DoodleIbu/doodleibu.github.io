// Populate via CSV
// let players = {123: "test", 456: "test2"};
// let events = {123456: "shining finger sword"};
// let sets = [
//     {"player1_id": 123, "player2_id": 456, "day": 1, "winner": "B", "event_id": 123456},
//     {"player1_id": 123, "player2_id": 456, "day": 2, "winner": "B", "event_id": 123456},
// ];
// let ratings = [
//     {"player_id": 123, "day": 1, "rating": 20},
//     {"player_id": 456, "day": 1, "rating": -20},
//     {"player_id": 123, "day": 2, "rating": 40},
//     {"player_id": 456, "day": 2, "rating": -40},
// ];

let players = {};
let events = {};
let sets = [];
let ratings = [];

const RATING_FUDGE = 1000;
const MTA_RELEASE_DATE = new Date(2018, 5, 22);

function populatePlayerDropdown() {
    Object.keys(players).forEach(function(key) {
        $(".player-select").append("<option value='" + key + "'>" + players[key] + "</option>");
    });
}

function displayPlayerRankings(filterDays) {
    let mostRecentPlayerRating = {}

    let currentDate = new Date();
    let oneDay = 24 * 60 * 60 * 1000;
    let daysSinceRelease = Math.round(Math.abs((currentDate.getTime() - MTA_RELEASE_DATE.getTime()) / oneDay));

    // Filter out ratings that occur before daysSinceRelease - filterDays.
    let daysThreshold = daysSinceRelease - filterDays;

    // There's very likely a better way to do this.
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
    $(".player-rankings-list").empty();
    rankings.forEach(function(rank, index) {
        $(".player-rankings-list").append("<div class='player-ranking'>" + (index + 1) + " - " + players[rank["player_id"]] + ": " + rank["rating"] + "</div>");
    });
}

$(".player-rankings-filter-button").on("click", function() {
    filterDays = $(".player-rankings-filter-days-input").val();
    displayPlayerRankings(filterDays);
});

function getSetDate(set) {
    let setDate = new Date(MTA_RELEASE_DATE.getTime());
    setDate.setDate(setDate.getDate() + set["day"]);
    return setDate;
}

function displayPlayerSets(playerId) {
    playerSets = []
    sets.forEach(function(set) {
        if (set["player1_id"] === playerId || set["player2_id"] === playerId) {
            playerSets.push(set);
        }
    });

    playerSets.sort(function(first, second) {
        return first["day"] - second["day"];
    });

    playerSets.forEach(function(set) {
        let winnerName;
        let setRating;

        if (set["winner"] === "B") {
            winnerName = players[set["player1_id"]];
        } else {
            winnerName = players[set["player2_id"]];
        }

        setDate = getSetDate(set);
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
                "<td>" + setRating + "</td>" +
            "</tr>"
        );
    });
}

$(".player-select").on("change", function(){
    $(".player-sets .player-set").remove();

    let selectedPlayerId = parseInt($(".player-select").val());
    if (selectedPlayerId != -1) {
        displayPlayerSets(selectedPlayerId);
    }
});

function displayPlayerRatingHistory() {

}

function initialLoad() {
    if (Object.keys(players).length === 0 || Object.keys(events).length === 0 || 
        ratings.length === 0 || sets.length === 0) {
        return;
    }

    populatePlayerDropdown();
    displayPlayerRankings(-1);
}

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
