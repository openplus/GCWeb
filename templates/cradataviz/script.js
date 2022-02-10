(function($) {
    var instances = [];
    var svg = [];
    var chartDataStore = [];
    var chartLegend = [];
    var placeholderId = [];
    var params = [];
    var classArray = [];
    
    $('div.d3-chart').each( function(index, element) {
        /**
        * Get attributes from chart placeholder
        */
        var placeholderClass = this.attributes.class.nodeValue;
            placeholderId[index] = this.attributes.id.nodeValue;
        var placeholderName = this.attributes['data-name'].nodeValue;
        var placeholderParams = this.attributes['data-params'].nodeValue;
            classArray[index] = placeholderClass.split(" ");
            params[index] = $.parseJSON(placeholderParams);
        var placeholderTag = document.getElementById(placeholderName);

        // Store instances
        if ($.inArray('d3-pie', classArray[index]) > 0) {
            instances[index] = 'pie';
        }
        else if ($.inArray('d3-bar', classArray[index]) > 0) {
            instances[index] = 'bar';
        } 
        else if ($.inArray('d3-table', classArray[index]) > 0) {
            instances[index] = 'table';
        }
        
        if(placeholderTag.tagName === 'TABLE') {
            // Get table data
            chartDataStore[index] = [];
            chartDataStore[index]['header'] = getTableData('header', params[index]);
            chartDataStore[index]['data'] = getTableData('rows', params[index]);
            
            /**
            * Wrap chart in figure with caption
            */
            var tableCaption = $('table#' + placeholderName + ' caption').text();
            var tableContext = getTableData('context', params[index]);
            $(this).wrap("<figure></figure>");
            $(this).before("<figcaption>" + tableCaption + " (" + tableContext + ")</figcaption>");
            
            // Add bootstrap classes to set layout on Pie charts
            if ($.inArray('d3-pie', classArray[index]) > 0) {
                $(this).wrap("<div class='row'></div>");
                // $(this).addClass("col-md-9");
            }

            buildChart();
            buildCheckBoxArray();

        } else if(placeholderTag.tagName === 'A') {
            chartDataStore[index] = []

            d3.text(placeholderTag.attributes.href.nodeValue).get(function(e, r) {
                var data = d3.csv.parse(r);
                chartDataStore[index]['header'] = [];
                chartDataStore[index]['data'] = [];

                // TODO: Personalize the content depending on the CSV file/and the
                data.forEach(function (d, i) {
                    chartDataStore[index]['header'].push(d["Province or Territory"]);
                    chartDataStore[index]['data'].push(d["$45,916 or less"]);
                });
                
                buildChart(data);
                buildCheckBoxArray();
            });
        }

        function buildCheckBoxArray() {
            /**
            * Build checkbox array
            * TODO: join multiple chart filter together, so when you filter, you filter everychart and/or give the authors the opportunity to have independent filter
            * TODO: Add an option to chose between the category
            */
    
            if ($.inArray('d3-pie', classArray[index]) > 0) {
                $(".d3-filters").append("<div class='chart-filters filter-chart-" + index + "'></div>");
            }
            else if ($.inArray('d3-bar', classArray[index]) > 0) {
                $(".d3-filters").append("<div class='chart-filters filter-chart-" + index + "'></div>");
            }
    
            $.each( chartDataStore[index]['header'], function(key, value) {
                var checkboxLabel = value;
                var checkboxValue = value;
                var checkboxName = 'chart[' + index + '][' + key + ']';
                var checkboxTemplate = '<div class="checkbox"><label><input data-chart="' + index + '" data-index="' + key + '" type="checkbox" name="' + checkboxName + '" value="' + checkboxValue + '" checked>' + checkboxLabel + "</label></div>";
                
                $(".filter-chart-" + index).append(checkboxTemplate);
            });
            
            /**
            * Filter charts based on checkbox interaction
            */
            $('.chart-filters').each( function(index, element) {
                $(this).find(':checkbox').change(function() {
                    var chartRef = $(this).data("chart");
                    var newChartData = manipulateChartData(chartRef);
                    
                    if ($.inArray('d3-pie', classArray[index]) > 0) {
                        changePieData(plotPieData(newChartData['header'], newChartData['data']), chartRef);
                    }
                    else if ($.inArray('d3-bar', classArray[index]) > 0) {
                        changeBarData(newChartData['header'], newChartData['data'], chartRef);
                    }
                });
            });
        }
        
        /**
        * Helper function to manipulate chart data with checkbox input
        */
        function manipulateChartData(chartRef) {
            var chartDataHeader = chartDataStore[chartRef]['header'].slice(0);
            var chartDataRow = chartDataStore[chartRef]['data'][0].slice(0);
            var newHeader = [];
            var newRowData = [];
            var chartCheckboxRef = $(".filter-chart-" + chartRef).find(':checkbox');
            var i = 0;
            
            $.each( chartCheckboxRef, function(key, value) {
                //var checkboxInstance = $(this).data("index");
                
                if (this.checked) {
                    newHeader[i] = chartDataHeader[key];
                    newRowData[i] = chartDataRow[key];
                    i++;
                }
            });
            
            var newData = [];
            newData['header'] = newHeader;
            newData['data'] = newRowData;
            
            return newData;
        }
        
        
        /**
        * Append an invisiable div to the first d3-chart, to add the SVG pattern
        * For accessibility purpose
        */
        var pattern = d3.select(".d3-chart", ":first-child")
            .append("div")
            .attr({class: "d3-pattern"})
            .style({height: "0", position: 'absolute', left: '-1000px'});
        
        /**
        * May have to change the color scheme, but it's for testing purpose
        * used this palette : https://projects.susielu.com/viz-palette
        * This https://fossheim.io/writing/posts/accessible-dataviz-d3-intro/ recommend to not put too much pattern as it can be too busy on the eyes
        * TODO: Make multiple swatches so Author can chose which pattern and/or color they want
        */
        // var patternFills = [{id: "circle", type: "circle"}, {id: "dots", type: "dots"}, {id: "horizontal-stripe", type: "horizontal-stripe"}, {id: "diagonal-stripe", type: "diagonal-stripe"}, {id: "vertical-stripe", type: "vertical-stripe"}, {id: "crosshatch", type: "crosshatch"}];
        // var patternColors = {"palette-1": [{ color: "#ffd700", fill: "#fff"}, { color: "#ffb14e", fill: "#fff"}, { color: "#fa8775", fill: "#fff"}, { color: "#ea5f94", fill: "#fff"}, { color: "#cd34b5", fill: "#fff"}, { color: "#cd34b5", fill: "#fff"}, { color: "#9d02d7", fill: "#fff"}, { color: "#0000ff", fill: "#fff"}],
        //                       "palette-2": [{ color: "#1b9e77", fill: "#fff"}, { color: "#d95f02", fill: "#fff"}, { color: "#7570b3", fill: "#fff"}, { color: "#e7298a", fill: "#fff"}, { color: "#66a61e", fill: "#fff"}, { color: "#e6ab02", fill: "#fff"}, { color: "#a6761d", fill: "#fff"}]};

        createPattern("circle-1", "circle", "#ffd700", "#fff", 1, 5, 5);
        createPattern("dots-1", "dots", "#ffb14e", "#fff", 3);
        createPattern("horizontal-stripe-1", "horizontal-stripe", "#fa8775", "#fff");
        createPattern("diagonal-stripe-1", "diagonal-stripe", "#ea5f94", "#fff");
        createPattern("diagonal-stripe-2", "diagonal-stripe", "#cd34b5", "#fff", 3);
        createPattern("vertical-stripe-1", "vertical-stripe", "#9d02d7", "#fff");
        createPattern("crosshatch-1", "crosshatch", "#0000ff", "#fff", 0.5, 8, 8);
        
        
        function buildChart(data) {
            /**
            * Init D3 pie chart
            */
            if ($.inArray('d3-pie', classArray[index]) > 0) {
                var width = 960,
                height = 500,
                radius = Math.min(width, height) / 2;
    
                svg[index] = d3.select("#" + placeholderId[index])
                    .append('svg')
                    .attr({class: 'd3-svg', width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet', viewBox: '0 0 ' + (width / 2) + ' ' + (height / 2) + ''})
                    .append("g");
                svg[index].append("g")
                    .attr("class", "slices");
                svg[index].append("g")
                    .attr("class", "labels");
                svg[index].append("g")
                    .attr("class", "lines");
    
                svg[index].append("g").attr({["aria-label"]: "Total", class: "total"});
                svg[index].append("g").attr({["aria-label"]: "Legend", class: "legend", transform: "translate(0,15)"});
                
                // svg[index].attr("transform", "translate(" + width / 6 + "," + height / 4 + ")");
                svg[index].attr("transform", "translate(120,120)");
                
                changePieData(plotPieData(chartDataStore[index]['header'], chartDataStore[index]['data'][0]), index);
            }
            
            /**
            * Init D3 bar chart
            */
             else if ($.inArray('d3-bar', classArray[index]) > 0) {
                var chartHeader = chartDataStore[index]['header'];
                var chartData = chartDataStore[index]['data'][0];
          
                var margin = {top: 30, right: 10, bottom: 80, left: 125}
          
                var height = 700 - margin.top - margin.bottom,
                    width = 1140 - margin.left - margin.right,
                    barWidth = 10;
          
                svg[index] = d3.select("#" + placeholderId[index])
                  .append('svg')
                  .attr('preserveAspectRatio', 'xMinYMin meet')
                  .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
                svg[index].append('g')
                  .attr("class", "grid-x");
                svg[index].append('g')
                  .attr("class", "grid-y");
                svg[index].append('g')
                  .attr("class", "bars")
                  .attr('transform', 'translate(' + margin.left + ', ' + (margin.top - 1) + ')');
          
                changeBarData(chartHeader, chartData, index);
             }
    
            /**
            * Init D3 Table chart
            */
             else if ($.inArray('d3-table', classArray[index]) > 0) {
                var table = d3.select('.d3-table')
                    .append('table')
                    .attr("class", "wb-tables table");
        
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
             }
        }

        /**
        * Change data used in bar chart.
        */
        function changeBarData(chartHeader, chartData, instance) {
            var margin = {top: 30, right: 10, bottom: 80, left: 125}
            
            var height = 700 - margin.top - margin.bottom,
                width = 1140 - margin.left - margin.right,
                barWidth = 65;
            
            var yScale = d3.scale.linear()
                .domain([0, Math.max.apply(Math, chartData)])
                .range([0, height])
            
            var xScale = d3.scale.ordinal()
                .domain(d3.range(0, chartData.length))
                .rangeBands([0, width])
            
            var xScaleDomain = d3.scale.ordinal()
                .domain(chartHeader)
                .rangeBands([0, width])
                
            /**
             * TODO: Check if we can use multiple color with patterns
             */
            var colors = d3.scale.linear()
                .domain([0, chartData.length * .33, chartData.length * .66, chartData.length])
                .range(['#d6e9c6', '#bce8f1', '#faebcc', '#ebccd1'])
            
            var bars = svg[instance].select(".bars").selectAll('rect').data(chartData, function(d) { return d; });
            
            bars.enter().append('rect')
                .style('fill', '#69b3a2')
                .attr('width', barWidth)
                .attr('x', function (data, i) {
                    return xScale(i);
                })
                .attr('height', function (data) {
                    return yScale(data);
                })
                .attr('y', function (data) {
                    return height - yScale(data);
                })
                .on('mouseover', function (data) {
                    d3.select(this)
                    .style('fill', '#DE7552')
                })
                .on('mouseout', function (data) {
                    d3.select(this)
                    .style('fill', '#69b3a2')
                });

            svg[instance].select(".bars").selectAll('text').data(chartData)
                .enter().append("text")
                .attr("text-anchor", "middle")
                .attr("font-size", "13px")
                .attr("x", function(data, i) { 
                    return barWidth / 2 + xScale(i); 
                })
                .attr("y", function(data) { 
                    return height - yScale(data) - 5;
                })
                .text(function(data) { 
                    return data; 
                });       
            
            var verticalGuideScale = d3.scale.linear()
                .domain([0, Math.max.apply(Math, chartData)])
                .range([height, 0])
            
            var vAxis = d3.svg.axis()
                .scale(verticalGuideScale)
                .orient('left')
                .ticks(10)
            
            var verticalGuide = svg[instance].select(".grid-y");
            vAxis(verticalGuide)
            verticalGuide.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
            verticalGuide.selectAll('path')
                .style({fill: 'none', stroke: "#000"})
            verticalGuide.selectAll('line')
                .style({stroke: "#000"})
                
            var hAxis = d3.svg.axis()
                .scale(xScaleDomain)
                .orient('bottom')
                .ticks(chartData.size)
            
            var horizontalGuide = svg[instance].select(".grid-x");
            hAxis(horizontalGuide)
            horizontalGuide.attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')')
            horizontalGuide.selectAll('path')
                .style({fill: 'none', stroke: "#000"})
            horizontalGuide.selectAll('line')
                .style({stroke: "#000"});
            
            // Rotate X axis labels
            svg[instance].select(".grid-x").selectAll(".tick text")
                .attr("font-size", "13px")
                .call(wrap, xScale.rangeBand());
                // .attr("transform", "translate(-10,10)rotate(-45)")
                // .style("text-anchor", "end")
            
            // Axis titles
            svg[instance].select(".grid-x").append("text")
                .attr("text-anchor", "end")
                .attr("x", width / 2)
                .attr("y", 70)
                .text("X axis title");

            svg[instance].select(".grid-y").selectAll(".tick text")
                .attr("font-size", "13px")
            
            svg[instance].select(".grid-y").append("text")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left + 20)
                .attr("x", -height / 2)
                .text("Y axis title")

            
            // bars.exit()
            //     .remove();

            // svg[instance].select(".bars").selectAll('text').data(chartData)
            //     .exit().remove();
        }
        
        /**
        * Prepare table data for plotting.
        */
        function plotPieData (header, data){
            return header.map(function(label, i) {
                return { label: label, value: data[i] }
            });
        }
        
        /**
        * Change data used in pie chart.
        */
        function changePieData(data, instance) {
            var width = 250,
                height = 250,
                radius = Math.min(width, height) / 2;
            
            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) {
                    return d.value;
                });
            
            var labelKey = function(d){ return d.data.label; };
            
            var color = d3.scale.ordinal()
                .domain(chartDataStore[instance]['header'])
                .range([
                    "url(#circle-1)", "#ffd700", 
                    "url(#dots-1)", "#ffb14e", 
                    "url(#horizontal-stripe-1)", "#fa8775", 
                    "url(#diagonal-stripe-1)", "#ea5f94",
                    "url(#diagonal-stripe-2)", "#cd34b5",
                    "url(#vertical-stripe-1)", "#9d02d7", 
                    "url(#crosshatch-1)", "#0000ff"
                ]);
            
            var arc = d3.svg.arc()
                .outerRadius(radius * 0.8)
                .innerRadius(radius * 0.4);
            
            var outerArc = d3.svg.arc()
                .innerRadius(radius * 0.9)
                .outerRadius(radius * 0.9);
            
            var showLabels = params[instance]['labels'];
            
            var slice = svg[instance].select(".slices").selectAll("path.slice");

            // Pie slices
            var data0 = slice.data(),
                data1 = pie(data);
            
            
            slice = slice.data(data1, labelKey);
                
            slice.enter()
                .insert("path")
                .each(function (d, i) { this._current = findNeighborArc(i, data0, data1, labelKey) || d; })
                .style("fill", function(d) { return color(d.data.label); })
                .attr("stroke", "white")
                .attr("stroke-width", 1)
                .attr("class", "slice")
                .style("opacity", 0.8)
                .attr("title", function(d) { return d.data.label; });
            
            slice
                .transition().duration(1000)
                .attrTween("d", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        return arc(interpolate(t));
                    };
                })
            
            
            /**
             * Show the total of each selected box in the middle of the donut
             */
            var total = 0;
            for (var i = 0; i < data.length; i++) {
                total += parseInt(data[i].value);
            }

            var showTotal = svg[instance].select(".total");
        
            showTotal.append("text")
                .attr({dy: "0.35em", ["text-anchor"]: "middle"})
                .text(total)
                .style({fill: "black", opacity: 1, ["font-size"]: 12});

    
            showTotal.selectAll("text")
                .each(function(d, i) {
                    if(i > 0) {
                        showTotal.select("text").remove();
                    }
                });

            if ((showLabels === 'false') || (typeof showLabels === 'undefined')) {
                // Make slices hoverable
                slice
                    .attr("class", "slice slice-hover")
                
                // Do not show labels, add title element instead
                // var tooltips = svg[instance].selectAll("path")
                //     .append("title")
                //     .classed("tooltip", true)
                //     .text(function(d) {
                //         return d.data.label + ' (' + d.data.value + ')';
                //     });

                // Testing this code:
                // https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html
                var tooltips = d3.select("div.d3-chart")
                    .attr('style', 'position: relative;')
                    .append("div")
                    .attr('class', 'tooltip')
                    .style("background-color", "white")
                    .style("border", "solid")
                    .style("border-width", "1px")
                    .style("border-radius", "5px")
                    .style("padding", "5px")

                // Three function that change the tooltip when user hover / move / leave a cell
                var mouseover = function(d) {
                    tooltips
                        .style("opacity", 1)

                    d3.select(this)
                        .style("stroke", "white")
                        .style("opacity", 1)
                }

                var mousemove = function(d) {
                    tooltips
                        .html(d.data.label + ' (' + d.value + ')')
                        .style("left", (d3.mouse(this)[0] + 100) + "px")
                        .style("top", (d3.mouse(this)[1] + 70) + "px")
                }
                var mouseleave = function(d) {
                    tooltips
                        .style("opacity", 0)

                    d3.select(this)
                        .style("stroke", "white")
                        .style("opacity", 0.8)

                }

                slice
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                
                // Build legend
                chartLegend[instance] = svg[instance].select(".legend").selectAll(".legend-entry")
                    .data(pie(data))
                    .enter().append("g")
                    .attr("transform", function(d,i){
                        return "translate(" + (width - 120) + "," + (i * 15 - (height / 2) + 8) + ")";
                    })
                    .attr("class", "legend-entry");
                
                chartLegend[instance].append("rect")
                    .attr("width", 8)
                    .attr("height", 8)
                    .attr("fill", function(d) {
                        return color(d.data.label);
                    });
                
                chartLegend[instance].append("text")
                    .text(function(d){
                        return d.data.label + " - " + d.data.value;
                    })
                    .style("font-size", 10)
                    .attr("y", 8)
                    .attr("x", 10);
            }
            else {
                // Show labels
                var text = svg[instance].select(".labels").selectAll("text")
                    .data(pie(data), labelKey);
                
                text.enter()
                    .append("text")
                    .attr("dy", ".35em")
                    .text(function(d) {
                        return d.data.label + ' (' + d.data.value + ')';
                    });
                
                function midAngle(d){
                    return d.startAngle + (d.endAngle - d.startAngle) / 2;
                }
                
                text.transition().duration(1000)
                    .attrTween("transform", function(d) {
                        this._current = this._current || d;
                        var interpolate = d3.interpolate(this._current, d);
                        this._current = interpolate(0);
                        return function(t) {
                            var d2 = interpolate(t);
                            var pos = outerArc.centroid(d2);
                            pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                            return "translate("+ pos +")";
                        };
                    })
                    .styleTween("text-anchor", function(d){
                        this._current = this._current || d;
                        var interpolate = d3.interpolate(this._current, d);
                        this._current = interpolate(0);
                        return function(t) {
                            var d2 = interpolate(t);
                            return midAngle(d2) < Math.PI ? "start" : "end";
                        };
                    });
                
                text.exit().remove();
                
                // Slice to text ploylines
                var polyline = svg[instance].select(".lines").selectAll("polyline")
                    .data(pie(data), labelKey);
                
                polyline.enter()
                    .append("polyline");
                
                polyline.transition().duration(1000)
                    .attrTween("points", function(d){
                        this._current = this._current || d;
                        var interpolate = d3.interpolate(this._current, d);
                        this._current = interpolate(0);
                        return function(t) {
                            var d2 = interpolate(t);
                            var pos = outerArc.centroid(d2);
                            pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                            return [arc.centroid(d2), outerArc.centroid(d2), pos];
                        };
                    });
                
                polyline.exit().remove();
            }
        };
        
        
        /**
        * Helper function to get table data.
        */
        function getTableData(scope, params) {
            var type = params['plot_type'];
            var row = params['row'];
            var column = params['column'];
            var excludeColumn = params['exclude_column'];
            var excludeRow = params['exclude_row'];
            
            if (scope == 'header') {
                var tableHeaderData = [];
                
                $("table#" + placeholderName).each(function() {
                    // Header
                    var tableDataArray = [];
                    
                    if (type == 'row') {
                        var tableHeader = $(this).find('thead th').not(':first').not(':eq(' + excludeColumn + ')');
                    }
                    else if (type == 'column') {
                        var tableHeader = $(this).find('tbody tr').not(':nth-child(' + excludeRow + ')').find('th');
                    }
                    
                    if (tableHeader.length > 0) {
                        tableHeader.each(function() {
                            tableDataArray.push($(this).text());
                        });
                        tableHeaderData.push(tableDataArray);
                    }
                });
                
                return tableHeaderData[0];
            }
            else if (scope == 'rows') {
                var rowTableData = [];
                
                $("table#" + placeholderName).each(function() {
                    // Body
                    var tableDataArray = [];
                    
                    if (type == 'row') {
                        var tableData = $(this).find('tr:nth-child(' + row + ') td').not(':eq(' + excludeColumn + ')');
                    }
                    else if (type == 'column') {
                        var tableData = $(this).find('tr').not(':eq(' + excludeRow + ')').find('td:nth-child(' + column + ')');
                    }
                    
                    if (tableData.length > 0) {
                        tableData.each(function() {
                            tableDataArray.push($(this).text());
                        });
                        rowTableData.push(tableDataArray);
                    }
                });
                
                return rowTableData;
            }
            else if (scope == 'context') {
                // Context
                var tableContext = '';
                
                $("table#" + placeholderName).each(function() {
                    if (type == 'row') {
                        tableContext = $(this).find('tbody tr:nth-child(' + row + ')').find('th').text();
                    }
                    else if (type == 'column') {
                        tableContext = $(this).find('thead th:nth-child(' + column + ')').text();
                    }
                });
                
                return tableContext;
            }
        }
        
        /**
        * Function to create pattern directly into JS
        */
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
                typeAttr = {d: "M-1,1 l2,-2  M0,10 l10,-10 M9,11 l2,-2", stroke: colorType, ["stroke-width"]: 1 * weight };
            } else if(type == "vertical-stripe") {
                type = "rect";
                typeAttr = {width: 10, height: 1 * weight, fill: colorType};
            } else if(type == "circle") {
                typeAttr = {cx: 1 * weight, cy: 1 * weight, r: 1 * weight, fill: colorType};
            } else if(type == "crosshatch") {
                type = "path";
                typeAttr = {d: "M0 0L8 8ZM8 0L0 8Z", stroke: colorType, ["stroke-width"]: 1 * weight };
            }
            
            var pattern = d3.select(".d3-pattern")
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

        /**
         * Function to wrap axis labels to fit in multiple lines
         * https://bl.ocks.org/mbostock/7555321 
         */
         function wrap(text, width) {
            text.each(function() {
                var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
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
    });
})(jQuery);
