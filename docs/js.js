var clowns = undefined;
var data = undefined;
var total = undefined;
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

    total = {
        population: 0,
        voted: 0,
    };
    _.each(clowns, function(clown) {
        total[clown] = 0;
    });
    data = _.map(data, function(e) {
        r = {
            city: e[0],
            coordinates: _.map(e[1].split(" "), parseFloat),
            population: parseInt(e[2])
        };
        total["population"] += r["population"];
        var t = parseInt(e[e.length - 1]);
        _.each(clowns, function(clown, i) {
            r[clown] = parseInt(e[3 + i]);
            t += r[clown];
            total[clown] += r[clown];
        });
        r["voted"] = t;
        total["voted"] += t;
        return r;
    });
}

function grad(palette, l, r, v) {
    var p = (v - l) / (r - l);
    var rgb = [Math.round(palette[0][0] + (palette[1][0] - palette[0][0]) * p),
               Math.round(palette[0][1] + (palette[1][1] - palette[0][1]) * p),
               Math.round(palette[0][2] + (palette[1][2] - palette[0][2]) * p)];
    rgb = _.map(rgb, function(v) {
        h = Number(v).toString(16);
        if (h.length == 1) {
            return "0" + h;
        }
        return h;
    });
    return "#" + rgb.join("");
}

function drawMap() {
    themap = L.map("map").setView([54.0, 27.0], 6);
    L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: "theiced/ck7jih4ak0ikx1inrdvmk8cc3",
        tileSize: 512,
        zoomOffset: -1,
        accessToken: "pk.eyJ1IjoidGhlaWNlZCIsImEiOiJjazdqMTN2MW0wb3A1M2VvMm84enBkc21oIn0.twBqvzeUoRo1BxvwoZb87A"
    }).addTo(themap);

    minp = _.min(data, function(e) {
        return e.population;
    }).population;
    maxp = _.max(data, function(e) {
        return e.population;
    }).population;
    minvp = _.min(data, function(e) {
        return e.voted / e.population;
    });
    minvp = minvp.voted / minvp.population;
    maxvp = _.max(data, function(e) {
        return e.voted / e.population;
    });
    maxvp = maxvp.voted / maxvp.population;
    _.each(data, function(e) {
        tooltip = "<table>";
        tooltip += "<tr><td><strong>" + e.city + "</strong></td><td class=\"ralign\"><strong>" + e.population + "</strong></td></tr>";
        tooltip += _.map(clowns, function(clown) {
            return "<tr><td>" + clown + "</td><td class=\"ralign\">" + e[clown] + "</td></tr>";
        }).join("");
        tooltip += "</table>";
        L.circle(e.coordinates, {
            radius: 1000 + (5000 - 1000) * ((e.population - minp) / (maxp - minp)),
            weight: 1,
            color: grad([[236, 110, 18], [236, 70, 30]], minvp, maxvp, e.voted / e.population),
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

function drawTable() {
    var t = "";
    t += "<thead>";
    t += "<tr>";
    t += "<td rowspan=\"2\">Город</td>";
    t += "<td rowspan=\"2\">Население</td>";
    t += "<td colspan=\"2\">Проголосовало</td>";
    _.each(clowns, function(clown) {
        t += "<td colspan=\"3\">" + clown + "</td>";
    });
    t += "</tr>";
    t += "<tr>";
    t += "<td>#</td>";
    t += "<td>%</td>";
    _.each(clowns, function(clown) {
        t += "<td>#</td>";
        t += "<td>%</td>";
        t += "<td>%%</td>"
    });
    t += "</tr>";
    t += "</thead>";

    _.each(data.concat([total]), function(e) {
        t += "<tr>";
        if (e.city === undefined) {
            t += "<td><strong>Всего</strong></td>";
        } else {
            t += "<td>" + e.city + "</td>";
        }
        t += "<td>" + e.population + "</td>";
        t += "<td>" + e.voted + "</td>";
        t += "<td>" + sprintf("%.3f", (e.voted / e.population) * 100) + "</td>";
        _.each(clowns, function(clown) {
            t += "<td>" + e[clown] + "</td>";
            t += "<td>" + sprintf("%.3f", (e[clown] / e.voted) * 100) + "</td>";
            t += "<td>" + sprintf("%.3f", (e[clown] / e.population) * 100) + "</td>";
        });
        t += "</tr>";
    });

    $("#table").append(t);
}

$(document).ready(function() {
    $(".menu .item").tab();

    $.ajax({
        url: "https://raw.githubusercontent.com/iced/primariezzz/master/results.csv",
        success: function(d) {
            parseData(d);
            drawMap();
            drawTable();
        }
    });
});
