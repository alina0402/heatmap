const JSONFILE = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
const PADDING = 60;
const YAXISPADDING = 10;
const LEGENDWIDTH = 40;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const COLORS = ["rgba(13, 71, 161, 1)",
        "rgba(30, 136, 229, 1)",
        "rgba(66, 165, 245, 1)",
        "rgba(144, 202, 249, 1)",
        "rgba(187, 222, 251, 1)",
        "rgba(227, 242, 253, 1)",
        "rgba(255, 235, 238, 1)",
        "rgba(239, 154, 154, 1)",
        "rgba(239, 83, 80, 1)",
        "rgba(211, 47, 47, 1)",
        "rgba(183, 28, 28, 1)"]


function makeLegend(svg, colors, values, baseTemp, height) {
        const cellHeight = 10;
        const cellWidth = 40;
        const borderColor = "black";

        let g = svg.append("g")
          .attr("id", "legend")
          .attr("transform", "translate(" + PADDING + "," + (height - cellHeight - 10) + ")");
        
        g.selectAll("#legend rect")
          .data(colors)
          .enter()
          .append("rect")
          .style("fill", (d) => d)
          .style("stroke", borderColor)
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            .attr("x", (d, i) => i*cellWidth )
            .attr("y", 0);

        g.selectAll("#legend text")
          .data(values)
          .enter()
          .append("text")
          .text(d => d3.format(".2f")(d[0]+baseTemp))
          .attr("x", (d, i) =>i*cellWidth - 5)
          .attr("y", cellHeight+10)
          .attr("z-index", "-1")
          .attr("font-size", "10px");      
        // and the last text:
        g.append("text")
           .text(d3.format(".2f")(values[values.length-1][1]+baseTemp))
           .attr("x", values.length*cellWidth - 5)
           .attr("y", cellHeight+10)
           .attr("font-size", "10px");      
 
}

document.addEventListener('DOMContentLoaded', function () {
        const visWidth = document.getElementById('container').clientWidth - PADDING;
        const titlesHeight = document.getElementById("title").offsetHeight + document.getElementById("description").offsetHeight;
        const visHeight = document.getElementById('container').clientHeight
                - titlesHeight
                - PADDING
                - LEGENDWIDTH;


        d3.json(JSONFILE, function (data) {
                // minimum and maximum temperatures:
                const minVariance = d3.min(data.monthlyVariance.map(item => item.variance));
                const maxVariance = d3.max(data.monthlyVariance.map(item => item.variance));
                const step = (maxVariance - minVariance) / COLORS.length;
                const variances = new Array(COLORS.length).fill([0, 0]) // the array of variances: [[min, max], ...]
                        .map((item, i) => [minVariance + step * i, minVariance + step * (i + 1)]);

                // change description: 
                d3.select("#description")
                        .text("1753 - 2015: base temperature " + data.baseTemperature + "C");

                // Temperature matrix: [[year, month, variance], ...]
                const tempMatrix = data.monthlyVariance.map(
                        (item) => [item.year,
                        MONTHS[item.month - 1],
                        item.variance, 
                        item.month-1]);
                // make SVG:
                let svg = d3.select("#visData")
                        .append("svg")
                        .attr("width", visWidth)
                        .attr("height", visHeight);

                // MAKE AXES:
                // Y-Axis:
                const heightDiv12 = Math.floor((visHeight - YAXISPADDING) / 13); // height of the cell 
                const yAxisRange = function () { // making the y-range to scale months
                        return new Array(13).fill(1).map((item, i) => heightDiv12 * i);
                }
                const yTicksArr = yAxisRange();
                let yScale = d3.scaleOrdinal()
                        .domain(MONTHS)
                        .range(yTicksArr);
                let yAxis = d3.axisLeft(yScale)
                        .tickValues(MONTHS);
                svg.append("g")
                        .attr("transform", "translate(" + PADDING + ", " + YAXISPADDING + ")")
                        .attr('id', 'y-axis')
                        .call(yAxis)
                        .selectAll(".tick") // move all ticks down 
                        .attr("transform", (d, i) => "translate (0, " + +(yTicksArr[i] + heightDiv12 / 2) + ")");

                // X-Axis:
                const xValueMin = tempMatrix[0][0];
                const xValueMax = tempMatrix[tempMatrix.length - 1][0];

                const xScale = d3.scaleLinear()
                        .domain([xValueMin, xValueMax])
                        .range([PADDING+1, visWidth - PADDING]);
                const xAxis = d3.axisBottom(xScale)
                        .ticks(20)
                        .tickFormat(d3.format(".0f"));

                svg.append("g")
                        .attr("transform", "translate(0, " + (yTicksArr[12] + YAXISPADDING) + ")")
                        .attr("id", "x-axis")
                        .call(xAxis);

                // MAKE TOOLTIP:
                const tooltip = d3.selectAll('#visData')
                        .append('div')
                        .attr('id', 'tooltip')
                        .style('opacity', 0);

                // MAKE CELLS (Temperature map):
                const cellWidth = (visWidth / data.monthlyVariance.length) * 12;
                const getColor = function (variance, n) {
                        if (variance === -100)
                                return "rgba(183, 28, 28, 0)";
                        for (let i = 0; i < COLORS.length; i++) {
                                if (variances[i][0] <= variance && variances[i][1] > variance) {
                                        return COLORS[i];
                                }
                        }
                }
                svg.selectAll("rect")
                        .data(tempMatrix)
                        .enter()
                        .append("rect")
                        .attr("class", "cell")
                        .attr("data-year", d => d[0])
                        .attr("data-month", d => d[3])
                        .attr("data-temp", d => data.baseTemperature + d[2])
                        .attr("x", (d) => xScale(d[0]))
                        .attr("y", (d) => yScale(d[1])+heightDiv12/2-YAXISPADDING/2)
                        .style("fill", (d, i) => getColor(d[2], i))
                        .attr("width", cellWidth)
                        .attr("height", heightDiv12)
                        .on("mouseover", (d, i) => {
                                tooltip.transition()
                                        .duration(200)
                                        .style("opacity", 1);
                                tooltip.html(d[0] + " (" + d[1] 
                                             + ")<br>t = " 
                                             + d3.format(".2f")(data.baseTemperature + d[2]) + "&#8451;"
                                             + "<br>variance = " + d3.format(".2f")(d[2]) + "&#8451;")
                                        .style("left", xScale(d[0]) + "px")
                                        .style("top", yScale(d[1]) + "px")
                                        .attr("data-year", d[0]);
                        })
                        .on("mouseout", () => {
                                tooltip.transition()
                                        .duration(200)
                                        .style("opacity", 0);
                        });

                // LEGEND:
                makeLegend(svg, COLORS, variances, data.baseTemperature, visHeight);

        });

});

