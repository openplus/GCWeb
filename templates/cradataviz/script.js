// TODO: Confirm if we need to use the latest version of D3 (preferably. yes). if we need to use the latest version, will need to convert this code
// TODO: Responsive design
var width = 650,
    height = 600,
    margin = 50,
    radius = Math.min(width, height) / 2 - margin;

var pattern = d3.select(".donut-chart")
    .append("div")
    .attr({class: "donut-pattern", height: "0"});

// May have to change the color scheme, but it's for testing purpose
// used this palette : https://projects.susielu.com/viz-palette
createPattern("circle-1", "circle", "#ffd700", "#fff", 2);
createPattern("dots-1", "dots", "#ffb14e", "#fff", 3);
createPattern("horizontal-stripe-1", "horizontal-stripe", "#fa8775", "#fff");
createPattern("diagonal-stripe-1", "diagonal-stripe", "#ea5f94", "#fff");
createPattern("diagonal-stripe-2", "diagonal-stripe", "#cd34b5", "#fff", 3);
createPattern("vertical-stripe-1", "vertical-stripe", "#9d02d7", "#fff");
createPattern("crosshatch-1", "crosshatch", "#0000ff", "#fff", 0.5, 8, 8);

// Called a mixed of color and pattern
// Kept the same 7 colors, but added pattern to each repeating color, may have to be changed
var color = d3.scale.ordinal().range(
    [
        "url(#circle-1)", "#ffd700", 
        "url(#dots-1)", "#ffb14e", 
        "url(#horizontal-stripe-1)", "#fa8775", 
        "url(#diagonal-stripe-1)", "#ea5f94",
        "url(#diagonal-stripe-2)", "#cd34b5",
        "url(#vertical-stripe-1)", "#9d02d7", 
        "url(#crosshatch-1)", "#0000ff"
    ]);

// Creating the pie
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
    .attr({width: width, height: height})
    .append("g")
    .attr("transform", "translate(" + ((width / 2) - (margin * 2)) + "," + height / 2 + ")");

svg.append("g").attr("class", "slices");
svg.append("g").attr({["aria-label"]: "Total", class: "label-total"});
svg.append("g").attr({["aria-label"]: "Legend", class: "legend", transform: "translate(" + (width / 2 - (margin * 2)) + ",-" + ((height / 2) - (margin * 2.50)) + ")"});

var path = svg.select(".slices").selectAll("path");

d3.csv("http://workzone/WET4/development/qtt972/d3-visualisation/tbl01-en.csv", type, function (error, data) {
    if (error) throw error;

    /*  
        STARTS TABLE
        Add a table,
        TODO: Be able to add and remove row depending of what is selected, and be able to sort
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
    createInput(allCategories, "radio", updateGraph, "categories");

    // We created the checkbox to choose which region we want to show
    // TODO: Validate if it would be better to add the select tag instead of the checkbox
    createInput(allCategories[0].values, "checkbox", updateGraph, "names");

    // Create graph in screen
    updateGraph();

    function updateGraph() {
        // Variable that will contain selected provinces/territories with selected category
        var selectedDataSet = [];
        
        d3.select(".donut-labels").selectAll('input[type="radio"]').each(function (d) {
            r = d3.select(this);
            // If the checkbox is selected
            if (r.property("checked")) {
                d3.select(".donut-labels").selectAll('input[type="checkbox"]').each(function (e) {
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

        path.enter()
            .append("path")
            .each(function (d, i) { this._current = findNeighborArc(i, data0, data1, key) || d; })
            .attr({fill: function (d) { return color(d.data.name); }, stroke: "white", ["stroke-width"]: 2})
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
            .attr({dy: "0.35em", ["text-anchor"]: "middle"})
            .text(total)
            .style({fill: "black", opacity: 1});

        labelTotal.selectAll("text")
            .each(function(d, i) {
                // To use correctly the "remove" function, we had to add a data, then enter, and then exit to "joint" the data that was being removed
                // But the variable used is not an array, so a small function was created to check if there is more than one text tag, then remove the first one
                if(i > 0) {
                    labelTotal.select("text").remove();
                }
            });

        // We append the legend with the current information 
        var legend = svg.select(".legend")
            .selectAll('.legend-entry')
            .data(newDataSet)
            .enter()
            .append('g')
            .attr({class: "legend-entry", transform: function(d, i) { return "translate(0," + i * 25 + ")"; } });

        legend.append('rect')
            .attr({class: "legend-rect", width: 18, height: 18, fill: function(d) { return color(d.name) }});
        
        legend.append('text')
            .attr({class: "legend-text", x: 25, y: 10, dy: "0.35em"})
            .text(function (d) {
                return d.name;
            });

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

// Small function to generate the input, to avoid repeating ourself
function createInput(data, type, onChange, name) {
    var createLabels = d3.select(".donut-labels")
        .append("div")
        .attr("class", "form-group")
        .selectAll("div")
        .data(data)
        .enter().append("div")
        .attr("class", type)
        .append("label");

    createLabels.append("input")
        .attr({type: type, name: name, value: function(d) { return d.key;}})
        .on("change", onChange)
        .property("checked", true);
        
    createLabels.append("span")
        .text(function (d) { return d.key; });
}

// Small function to create a pattern in SVG
// May have to optimize it
function createPattern(id, type, colorRect, colorType, weight = 1, width = 10, height = 10) {
    var typeAttr;
    
    if(type == "dots") {
        type = "rect";
        typeAttr = {width: 1 * weight, height: 1 * weight, fill: colorType};
    } else if(type == "horizontal-stripe") {
        type = "rect";
        typeAttr = {width: 1 * weight, height: 10, fill: colorType};
    } else if(type == "diagonal-stripe") {
        type = "path";
        typeAttr = {d: "M-1,1 l2,-2            M0,10 l10,-10            M9,11 l2,-2", stroke: colorType, ["stroke-width"]: 1 * weight };
    } else if(type == "vertical-stripe") {
        type = "rect";
        typeAttr = {width: 10, height: 1 * weight, fill: colorType};
    } else if(type == "circle") {
        typeAttr = {cx: 1 * weight, cy: 1 * weight, r: 1 * weight, fill: colorType};
    } else if(type == "crosshatch") {
        type = "path";
        typeAttr = {d: "M0 0L8 8ZM8 0L0 8Z", stroke: colorType, ["stroke-width"]: 1 * weight };
    }

    var pattern = d3.select(".donut-pattern")
        .append("svg")
        .attr({width: width, height: height, version: "1.1", xmlns: "http://www.w3.org/2000/svg"})
        .append("defs")
        .append("pattern")
        .attr({id: id, width: width, height: height, patternUnits: "userSpaceOnUse"});

    pattern.append("rect")
        .attr({width: width, height: height, fill: colorRect});

    pattern.append(type)
        .attr(typeAttr);
}
