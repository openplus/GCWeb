// TODO: Confirm if we need to use the latest version of D3 (preferably. yes). if we NEED to use the latest version, will need to convert this code
var width = 600,
    height = 600,
    margin = 50,
    radius = Math.min(width, height) / 2 - margin;

var color = d3.scale.category20();

var pie = d3.layout.pie()
    .value(function (d) { return d.value; })
    .sort(null);

var arc = d3.svg.arc()
    .innerRadius(radius * 0.8)
    .outerRadius(radius * 0.4);

var outerArc = d3.svg.arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9);

var svg = d3.select(".donut-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.append("g").attr("class", "slices");
svg.append("g").attr("class", "label-total");

var path = svg.select(".slices").selectAll("path");

d3.csv("tbl01-en.csv", type, function (error, data) {
    if (error) throw error;

    /*  
        STARTS TABLE
        Add a table,
        TODO: Be able to add and remove row depending of what is selected
     */
    var table = d3.select('.donut-chart')
        .append('table')
        .attr("class", "wb-tables table table-striped table-hover");

    var titles = d3.keys(data[0]);
    
    var titlesData = [];

    for (i = 0; i < titles.length-1; i++) {
        titlesData.push(titles[i]);
    }

    var headers = table.append('thead')
        .append('tr')
        .selectAll('th')
        .data(titlesData).enter()
        .append('th')
        .attr("scope", "col")
        .text(function (d) {
            return d;
        });
        
    var rows = table.append('tbody')
        .selectAll('tr')
        .data(data).enter()
        .append('tr');

    rows.selectAll('td')
        .data(function (d) {
            return titlesData.map(function (k) {
                return { 'value': d[k], 'name': k};
            });
        }).enter()
        .append('td')
        .attr('data-th', function (d) {
            return d.name;
        })
        .text(function (d) {
            return d.value;
        });
    // END TABLE
    
    // Had to rearrange the CSV in another form of array to be able to "nest" the data
    var newData = [];
    data.forEach(function (d) {
        newData.push({ name: d["Province or Territory"], category: "$45,916 or less", value: d["$45,916 or less"] });
        newData.push({ name: d["Province or Territory"], category: "$45,917 - $91,831", value: d["$45,917 - $91,831"] });
        newData.push({ name: d["Province or Territory"], category: "$91,832 - $142,353", value: d["$91,832 - $142,353"] });
        newData.push({ name: d["Province or Territory"], category: "$142,354 - $202,800", value: d["$142,354 - $202,800"] });
        newData.push({ name: d["Province or Territory"], category: "$202,801 or more", value: d["$202,801 or more"] });
        newData.push({ name: d["Province or Territory"], category: "All Brackets", value: d["All Brackets"] });
    });

    data = newData;

    // Nested categories, then the region, to be able to create 2 methos of selection
    var allCategories = d3.nest()
        .key(function (d) { return d.category; })
        .key(function (d) { return d.name; })
        .entries(data);

    // We are created the radio box, to select which category we want to see the data
    var labelAllCategories = d3.select("form")
        .append("div")
        .attr("class", "form-group")
        .append("p").append("strong")
        .text("Select a category")
        .selectAll("div")
        .data(allCategories)
        .enter().append("div")
        .attr("class", "radio").append("label");

    labelAllCategories.append("input")
        .attr("type", "radio")
        .attr("name", "categories")
        .attr("value", function (d) { return d.key; })
        .on("change", updateGraph)
        .property("checked", true);
        
    labelAllCategories.append("span")
        .text(function (d) { return d.key; });

    // We created the checkbox to choose which region we want to show
    // TODO: Validate if it would be better to add the select tag instead of the checkbox
    var labelAllNames = d3.select("form")
        .append("div")
        .attr("class", "form-group")
        .append("p").append("strong")
        .text("Select a province or territory")
        .selectAll("div")
        .data(allCategories[0].values)
        .enter().append("div")
        .attr("class", "checkbox").append("label");

    labelAllNames.append("input")
        .attr("type", "checkbox")
        .attr("name", "names")
        .attr("value", function (d) { return d.key; })
        .on("change", updateGraph)
        .property("checked", true);
        
    labelAllNames.append("span")
        .text(function (d) { return d.key; });

    // Create graph in screen
    updateGraph();

    function updateGraph() {
        // Variable that will contain selected provinces/territories with selected category
        var selectedDataSet = [];

        d3.select("form").selectAll('input[type="radio"]').each(function (d) {
            r = d3.select(this);
            // If the checkbox is selected
            if (r.property("checked")) {
                d3.select("form").selectAll('input[type="checkbox"]').each(function (e) {
                    cb = d3.select(this);
                    if (cb.property("checked")) {
                        // Gather information selected with checkboxes
                        for (i = 0; i < d.values.length; i++) {
                            if (d.values[i].key == cb.property("value")) {
                                selectedDataSet.push(d.values[i]);
                            }
                        }
                    }
                });
            }
        });

        // Varaible that push the new data together for a simpler version of the array
        var newDataSet = [];
        selectedDataSet.forEach(function(d) {
            d.values.forEach(function(e) {
                newDataSet.push({name: e.name, value: e.value});
            });
        });

        var data0 = path.data(),
            data1 = pie(newDataSet);

        // We are creating the slice to the path
        // TODO: Add pattern to be more accessible
        // SEE: https://fossheim.io/writing/posts/accessible-dataviz-d3-intro/
        path = path.data(data1, key);

        path.enter().append("path")
            .each(function (d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
            .attr("fill", function (d) { return color(d.data.name); })
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .append("title")
            .text(function (d) { return d.data.name; });

        path.exit()
            .datum(function (d, i) { return findNeighborArc(i, data1, data0, key) || d; })
            .transition()
            .duration(750)
            .attrTween("d", arcTween)
            .remove();
        
        path.transition()
            .duration(750)
            .attrTween("d", arcTween);

        // We will now calculate the total of each input selected and show it in the middle of the donut
        var total = 0;
        for (var i = 0; i < newDataSet.length; i++) {
            total += parseInt(newDataSet[i].value);
        }

        var labelTotal = svg.select(".label-total");
        
        labelTotal.append("text")
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .html(total)
            .style('fill', 'black')
            .style('opacity', 1);

        labelTotal.selectAll("text")
            .each(function(d, i) {
                // To use correctly the "remove" function, we had to add a data, then enter, and then exit to "joint" the data that was being removed
                // But the variable used is not an array, so a small function was created to check if there is more than one text tag, then remove the first one
                if(i > 0) {
                    labelTotal.select("text").remove();
                }
            });

        // TODO: Re-add the legend (?)
        // TODO: try to re-add the label, but may be with a tooltip this time ?
    }
});

function key(d) {
    return d.data.name;
}

function type(d) {
    d.value = +d.value;
    return d;
}

function findNeighborArc(i, data0, data1, key) {
    var d;
    return (d = findPreceding(i, data0, data1, key)) ? { startAngle: d.endAngle, endAngle: d.endAngle }
    : (d = findFollowing(i, data0, data1, key)) ? { startAngle: d.startAngle, endAngle: d.startAngle }
    : null;
}

// Find the element in data0 that joins the highest preceding element in data1.
function findPreceding(i, data0, data1, key) {
    var m = data0.length;
    while (--i >= 0) {
        var k = key(data1[i]);
        for (var j = 0; j < m; ++j) {
            if (key(data0[j]) === k) return data0[j];
        }
    }
}

// Find the element in data0 that joins the lowest following element in data1.
function findFollowing(i, data0, data1, key) {
    var n = data1.length, m = data0.length;
    while (++i < n) {
        var k = key(data1[i]);
        for (var j = 0; j < m; ++j) {
            if (key(data0[j]) === k) return data0[j];
        }
    }
}

function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
}

function arcTween(d) {
    var i = d3.interpolate(this._current, d);
    this._current = i(0);
    return function (t) { return arc(i(t)); };
}
