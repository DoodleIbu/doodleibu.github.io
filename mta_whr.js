fetch("data/player.csv").then(response => response.text()).then(text => {
    let csv = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    console.log(csv);
});
