var clowns = undefined;
var data = undefined;
var themap = undefined;

function parseData(d) {
    var lines = d.split("\n");
    clowns = lines[0].split(",").slice(3, -1);
    lines = _.filter(lines.slice(1), function(l) {
        return l != "";
    });
    data = _.map(lines, function(l) {
        return _.map(l.split(","), function(e) {
            return e.trim();
        });
    });
    data = _.map(data, function(e) {
        r = {
            city: e[0],
            coordinates: _.map(e[1].split(" "), parseFloat),
            population: parseInt(e[2])
        };
        var total = parseInt(e[e.length - 1]);
        _.each(clowns, function(clown, i) {
            r[clown] = parseInt(e[3 + i]);
            total += r[clown];
        });
        r["voted"] = total;
        return r;
    });
}

function drawResults() {
    maxp = _.max(data, function(e) {
        return e.population;
    }).population;
    minp = _.min(data, function(e) {
        return e.population;
    }).population;
    _.each(data, function(e) {
        tooltip = "<table>";
        tooltip += "<tr><td><strong>" + e.city + "</strong></td><td><strong>" + e.population + "</strong></td></tr>";
        tooltip += _.map(clowns, function(clown) {
            return "<tr><td>" + clown + "</td><td>" + e[clown] + "</td></tr>";
        }).join("");
        tooltip += "</table>";
        L.circle(e.coordinates, {
            radius: 1000 + (5000 - 1000) * ((e.population - minp) / (maxp - minp)),
            weight: 1,
            color: "red",
        }).bindTooltip(tooltip).addTo(themap);
    });

    minlatlng = [
        _.min(data, function(e) {
            return e.coordinates[0]
        }).coordinates[0],
        _.min(data, function(e) {
            return e.coordinates[1]
        }).coordinates[1]
    ];
    maxlatlng = [
        _.max(data, function(e) {
            return e.coordinates[0]
        }).coordinates[0],
        _.max(data, function(e) {
            return e.coordinates[1]
        }).coordinates[1]
    ];
    themap.fitBounds([minlatlng, maxlatlng]);
}

$(document).ready(function() {
    $(".menu .item").tab();

    themap = L.map("map").setView([54.0, 27.0], 6);
    L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: "mapbox/streets-v8",
        tileSize: 512,
        zoomOffset: -1,
        accessToken: "pk.eyJ1IjoidGhlaWNlZCIsImEiOiJjazdqMTN2MW0wb3A1M2VvMm84enBkc21oIn0.twBqvzeUoRo1BxvwoZb87A"
    }).addTo(themap);

    $.ajax({
        url: "https://raw.githubusercontent.com/iced/primariezzz/master/results.csv",
        success: function(d) {
            parseData(d);
            drawResults();
        }
    });
});
