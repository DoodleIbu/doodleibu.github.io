let players = []
let ratings = []
let sets = []

fetch("data/player.csv").then(response => response.text()).then(text => {
    let parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    players = parsed;
    console.log(csv);
});

fetch("data/rating.csv").then(response => response.text()).then(text => {
    let parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    ratings = parsed;
    console.log(csv);
});

fetch("data/sets.csv").then(response => response.text()).then(text => {
    let csv = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    sets = parsed;
    console.log(csv);
});


