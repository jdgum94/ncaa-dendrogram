const width = 900;
const height = 900;
const radius = width / 2 - 150; 

const svg = d3.select("#bracket-container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width/2},${height/2})`);

// FIX 1: Correctly mapped region coordinates
const regionLabels = [
    { name: "West", x: -width/2 + 80, y: -height/2 + 80, anchor: "start" },    // Top Left
    { name: "Midwest", x: -width/2 + 80, y: height/2 - 80, anchor: "start" }, // Bottom Left
    { name: "East", x: width/2 - 80, y: -height/2 + 80, anchor: "end" },      // Top Right
    { name: "South", x: width/2 - 80, y: height/2 - 80, anchor: "end" }       // Bottom Right
];

svg.selectAll(".region-label")
    .data(regionLabels)
    .enter().append("text")
    .attr("class", "region-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("text-anchor", d => d.anchor)
    .text(d => d.name);

const tree = d3.cluster().size([2 * Math.PI, radius]);

let currentModel = document.getElementById("dataSource").value;

d3.json("data.json").then(data => {
    const root = tree(d3.hierarchy(data));

    const link = svg.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    const node = svg.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

    const internalNodes = node.filter(d => d.children);
    internalNodes.append("circle")
        .attr("r", 4)
        .style("cursor", "pointer");

    const leafNodes = node.filter(d => !d.children);
    leafNodes.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .text(d => d.data.name);

    const hoverLayer = svg.append("g").attr("class", "hover-layer");

    function clearHover() {
        link.classed("link--active", false);
        node.classed("node--active", false);
        hoverLayer.selectAll("*").remove();
    }

    d3.select("#dataSource").on("change", function() {
        currentModel = this.value;
        clearHover();
    });

    // FIX 2: Applied rotation to hitboxes so they perfectly cover the text
    leafNodes.append("rect")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .attr("x", d => d.x < Math.PI ? 0 : -110)
        .attr("y", -12)
        .attr("width", 110)
        .attr("height", 24)
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            clearHover();
            const ancestors = d.ancestors();
            link.classed("link--active", l => ancestors.includes(l.source) && ancestors.includes(l.target));
            node.classed("node--active", n => ancestors.includes(n));

            const modelData = d.data[currentModel];
            if (modelData) {
                const probMapping = [
                    { node: ancestors[1], value: modelData.R32 },
                    { node: ancestors[2], value: modelData.S16 },
                    { node: ancestors[3], value: modelData.E8 },
                    { node: ancestors[4], value: modelData.F4 },
                    { node: ancestors[5], value: modelData.Champ }
                ];

                hoverLayer.selectAll(".prob-label")
                    .data(probMapping.filter(p => p.node && p.value !== undefined))
                    .join("text")
                    .attr("class", "prob-label")
                    .attr("transform", p => {
                        const x = p.node.y * Math.cos(p.node.x - Math.PI / 2);
                        const y = p.node.y * Math.sin(p.node.x - Math.PI / 2);
                        return `translate(${x},${y - 8})`; 
                    })
                    .attr("text-anchor", "middle")
                    .text(p => p.value + "%");
            }
        })
        .on("mouseout", clearHover);

    internalNodes.select("circle")
        .on("mouseover", function(event, d) {
            clearHover();
            
            const descendants = d.descendants();
            link.classed("link--active", l => descendants.includes(l.source) && descendants.includes(l.target));
            node.classed("node--active", n => descendants.includes(n));

            const depthToProb = {5: 'R32', 4: 'S16', 3: 'E8', 2: 'F4', 1: 'Champ', 0: 'Champ'};
            const probKey = depthToProb[d.depth];

            if (probKey) {
                const leaves = d.leaves();
                hoverLayer.selectAll(".prob-label")
                    .data(leaves)
                    .join("text")
                    .attr("class", "prob-label")
                    .attr("transform", p => {
                        const isLeft = p.x >= Math.PI;
                        const angle = p.x * 180 / Math.PI - 90;
                        const rad = radius - 15; 
                        return `rotate(${angle}) translate(${rad},0) ${isLeft ? "rotate(180)" : ""}`;
                    })
                    .attr("text-anchor", p => p.x < Math.PI ? "end" : "start")
                    .attr("dy", "0.31em")
                    .text(p => {
                        const modelData = p.data[currentModel];
                        return modelData && modelData[probKey] !== undefined ? modelData[probKey] + "%" : "";
                    });
            }
        })
        .on("mouseout", clearHover);
});