var instances = [];
var svg = [];
var chartDataStore = [];
var chartLegend = [];
var placeholderId = [];
var params = [];
var classArray = [];

$('div.d3-chart').once('dataviz').each( function(index, element) {
  /**
   * Get attributes from chart placeholder
   */
  var placeholderClass = this.attributes.class.nodeValue;
  placeholderId[index] = this.attributes.id.nodeValue;
  var placeholderName = this.attributes.name.nodeValue;
  var placeholderParams = this.attributes.params.nodeValue;
  classArray[index] = placeholderClass.split(" ");
  params[index] = $.parseJSON(placeholderParams);

  // Store instances
  if ($.inArray('d3-pie', classArray[index]) > 0) {
    instances[index] = 'pie';
  }
  else if ($.inArray('d3-bar', classArray[index]) > 0) {
    instances[index] = 'bar';
  }

  /**
   * Init corresponding DataTable
   */
  var table = $('table#' + placeholderName + ':not(.dataTable)').DataTable({
    dom: 'B',
    paging: false,
    sort: false,
    buttons: [ 'colvis' ]
  });

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
    $(this).addClass("col-md-9");
  }

  /**
   * Build checkbox array
   */
  if ($.inArray('d3-pie', classArray[index]) > 0) {
    $(this).before("<div class='col-md-3 chart-filters filter-chart-" + index + "'></div>");
  }
  else if ($.inArray('d3-bar', classArray[index]) > 0) {
    $(this).before("<div class='chart-filters filter-chart-" + index + "'></div>");
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
  $('.chart-filters').once('dataviz-filters').each( function(index, element) {
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
   * Init D3 pie chart
   */
  if ($.inArray('d3-pie', classArray[index]) > 0) {
    svg[index] = d3.select("#" + placeholderId[index])
      .append("svg")
      .append("g");
    svg[index].append("g")
      .attr("class", "slices");
    svg[index].append("g")
      .attr("class", "labels");
    svg[index].append("g")
      .attr("class", "lines");

    var width = 250,
        height = 250,
        radius = Math.min(width, height) / 2;

    svg[index].attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    changePieData(plotPieData(chartDataStore[index]['header'], chartDataStore[index]['data'][0]), index);
  }
  /**
   * Init D3 bar chart
   */
  else if ($.inArray('d3-bar', classArray[index]) > 0) {
    var chartHeader = chartDataStore[index]['header'];
    var chartData = chartDataStore[index]['data'][0];

    var margin = {top: 30, right: 10, bottom: 80, left: 135}

    var height = 600 - margin.top - margin.bottom,
        width = 1020 - margin.left - margin.right,
        barWidth = 10;

    svg[index] = d3.select("#" + placeholderId[index])
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('background', '#F6F6F6');
    svg[index].append('g')
      .attr("class", "grid-x");
    svg[index].append('g')
      .attr("class", "grid-y");
    svg[index].append('g')
      .attr("class", "bars")
      .attr('transform', 'translate(' + (margin.left + 20) + ', ' + margin.top + ')');

    changeBarData(chartHeader, chartData, index);
  }




  /**
   * Change data used in bar chart.
   */
  function changeBarData(chartHeader, chartData, instance) {
    var margin = {top: 30, right: 10, bottom: 80, left: 135}

    var height = 600 - margin.top - margin.bottom,
        width = 1020 - margin.left - margin.right,
        barWidth = 10;

    var yScale = d3.scale.linear()
        .domain([0, Math.max.apply(Math, chartData)])
        .range([0, height])

    var xScale = d3.scale.ordinal()
        .domain(d3.range(0, chartData.length))
        .rangeBands([0, width])

    var xScaleDomain = d3.scale.ordinal()
        .domain(chartHeader)
        .rangeBands([0, width])

    var colors = d3.scale.linear()
        .domain([0, chartData.length * .33, chartData.length * .66, chartData.length])
        .range(['#d6e9c6', '#bce8f1', '#faebcc', '#ebccd1'])

    svg[instance].select(".bars").selectAll('rect').data(chartData)
      .enter().append('rect')
      .style('fill', 'red')
      .attr('width', '10')
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
          .style('fill', '#3c763d')
      })
      .on('mouseout', function (data) {
        d3.select(this)
          .style('fill', 'red')
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
    svg[instance].select(".grid-x").selectAll("text")
      .attr("transform", "translate(-10,10)rotate(-45)")
      .style("text-anchor", "end")

    // Axis titles
    svg[instance].select(".grid-x").append("text")
      .attr("text-anchor", "end")
      .attr("x", width / 2)
      .attr("y", 70)
      .text("X axis title");

    svg[instance].select(".grid-y").append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left+20)
      .attr("x", -height / 2)
      .text("Y axis title")
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
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    var arc = d3.svg.arc()
      .outerRadius(radius * 0.8)
      .innerRadius(radius * 0.4);

    var outerArc = d3.svg.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);

    var showLabels = params[instance]['labels'];

    // Pie slices
    var slice = svg[instance].select(".slices").selectAll("path.slice")
      .data(pie(data), function(d) { return d.data.label; });

    slice.enter()
      .insert("path")
      .style("fill", function(d) { return color(d.data.label); })
      .attr("class", "slice")
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

    slice.exit().remove();

    if ((showLabels === 'false') || (typeof showLabels === 'undefined')) {
      // Make slices hoverable
      slice
        .attr("class", "slice slice-hover")

      // Do not show labels, add title element instead
      var tooltips = svg[instance].selectAll("path")
        .append("title")
        .classed("tooltip", true)
        .text(function(d) {
          return d.data.label + ' (' + d.data.value + ')';
        });

      // Build legend
      chartLegend[instance] = svg[instance].selectAll(".legend")
        .data(pie(data))
        .enter().append("g")
        .attr("transform", function(d,i){
          return "translate(" + (width - 120) + "," + (i * 20 - (height / 2) + 10) + ")";
        })
        .attr("class", "legend");

      chartLegend[instance].append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", function(d) {
          return color(d.data.label);
        });

      chartLegend[instance].append("text")
        .text(function(d){
          return d.data.label + "  " + d.data.value;
        })
        .style("font-size", 12)
        .attr("y", 10)
        .attr("x", 11);
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
}
