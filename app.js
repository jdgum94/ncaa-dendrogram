const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#bracket-container").append("svg")
    .attr("width", width)
    .attr("height", height);

const svgGroup = svg.append("g");

const treeHeight = 1000; 
const horizontalSpace = 1200; 
const centerGap = 80; 

// Zoom & Pan setup
const zoom = d3.zoom()
    .scaleExtent([0.2, 3])
    .on("zoom", (event) => {
        svgGroup.attr("transform", event.transform);
    });

const scaleFit = Math.min(width / (horizontalSpace + 250), height / (treeHeight + 100));
const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(scaleFit);
svg.call(zoom).call(zoom.transform, initialTransform);

let currentModel = document.getElementById("dataSource").value;
const depthToProb = {5: 'R32', 4: 'S16', 3: 'E8', 2: 'F4', 1: 'F2', 0: 'Champ'};
const seedAverages = {
    1: 8.5, 2: 7.0, 3: 5.5, 4: 4.5, 5: 3.5, 6: 2.8, 7: 2.0, 8: 1.5,
    9: 1.0, 10: 0.5, 11: 0.1, 12: -0.5, 13: -1.5, 14: -2.5, 15: -3.5, 16: -4.5
};

function formatValue(val, model) {
    if (model === 'net') return `#${-val}`;
    if (model === 'wab') return (val > 0 ? '+' : '') + val.toFixed(1);
    return val.toFixed(1) + "%";
}

function getWinner(nodeObj, model) {
    const leaves = nodeObj.leaves();
    const probKey = depthToProb[nodeObj.originalDepth];
    let winnerName = "";
    let maxVal = -Infinity;

    leaves.forEach(leaf => {
        let val;
        if (model === 'net') val = -(leaf.data.net || 1000); 
        else if (model === 'wab') val = (leaf.data.wab || 0);
        else val = (leaf.data[model] && leaf.data[model][probKey]) ? leaf.data[model][probKey] : 0;

        if (val > maxVal) { maxVal = val; winnerName = leaf.data.name; }
    });
    return { name: winnerName, value: maxVal };
}

function getLeafValueAtDepth(leafNode, depth, model) {
    const probKey = depthToProb[depth];
    if (model === 'net') return -(leafNode.data.net || 1000);
    if (model === 'wab') return leafNode.data.wab || 0;
    return (leafNode.data[model] && leafNode.data[model][probKey]) ? leafNode.data[model][probKey] : 0;
}

d3.json("data.json").then(data => {
    
    const root = d3.hierarchy(data);
    root.each(d => d.originalDepth = d.depth);

    const leftRoot = root.children[0];
    const rightRoot = root.children[1];

    const cluster = d3.cluster().size([treeHeight, horizontalSpace / 2]);
    
    cluster(leftRoot);
    leftRoot.each(d => {
        d.renderX = -d.y - centerGap; 
        d.renderY = d.x - treeHeight / 2;
    });

    cluster(rightRoot);
    rightRoot.each(d => {
        d.renderX = d.y + centerGap; 
        d.renderY = d.x - treeHeight / 2;
    });

    root.renderX = 0;
    root.renderY = 0; 

    const descendants = [root].concat(leftRoot.descendants(), rightRoot.descendants());
    const links = leftRoot.links().concat(rightRoot.links(), [
        { source: root, target: leftRoot },
        { source: root, target: rightRoot }
    ]);

    const linkGen = d3.linkHorizontal().x(d => d.renderX).y(d => d.renderY);

    const link = svgGroup.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("class", "link")
        .attr("d", linkGen);

    const node = svgGroup.append("g")
        .selectAll("g")
        .data(descendants)
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.renderX},${d.renderY})`);

    const internalNodes = node.filter(d => d.children);
    const leafNodes = node.filter(d => !d.children);

    // Visible Dots
    internalNodes.append("circle")
        .attr("r", 4.5)
        .style("fill", "#999")
        .style("stroke", "#fff")
        .style("stroke-width", "1.5px")
        .style("pointer-events", "none"); 

    // Base Leaf Text Element (Will be populated dynamically)
    leafNodes.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.renderX < 0 ? -8 : 8)
        .attr("text-anchor", d => d.renderX < 0 ? "end" : "start");

    // Dynamic Leaf Updating Function
    function updateLeafLabels() {
        leafNodes.select("text").text(d => {
            let valStr = "";
            if (currentModel === 'net') {
                valStr = `#${d.data.net || 1000}`;
            } else if (currentModel === 'wab') {
                const val = d.data.wab || 0;
                valStr = (val > 0 ? '+' : '') + val.toFixed(1);
            } else {
                // For probability models, default the base display to their R32 advance chance
                const val = (d.data[currentModel] && d.data[currentModel]['R32']) ? d.data[currentModel]['R32'] : 0;
                valStr = val.toFixed(1) + "%";
            }
            return `${d.data.name} (${valStr})`;
        });
    }

    // Run immediately on load
    updateLeafLabels();

    // Internal Text Container (Empty by default)
    internalNodes.append("text")
        .attr("class", "internal-text")
        .attr("dy", d => d.originalDepth === 0 ? "-35px" : "-10px") 
        .attr("text-anchor", "middle")
        .style("font-size", d => d.originalDepth === 0 ? "14px" : "11px") 
        .style("font-weight", d => d.originalDepth === 0 ? "bold" : "normal")
        .style("fill", "#0000ee");

    const regionLabels = [
        { name: "East", x: -horizontalSpace * 0.35, y: -treeHeight * 0.25 },
        { name: "South", x: -horizontalSpace * 0.35, y: treeHeight * 0.25 },
        { name: "Midwest", x: horizontalSpace * 0.35, y: -treeHeight * 0.25 },
        { name: "West", x: horizontalSpace * 0.35, y: treeHeight * 0.25 }
    ];
    
    svgGroup.selectAll(".region-label")
        .data(regionLabels)
        .enter().append("text")
        .attr("class", "region-label")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(d => d.name);

    function clearHover() {
        link.classed("link--active", false);
        node.classed("node--active", false);
        internalNodes.select(".internal-text").text(""); 
        leafNodes.select("text").style("fill", "#333"); 
    }

    // Trigger update on dropdown change
    d3.select("#dataSource").on("change", function() {
        currentModel = this.value;
        updateLeafLabels();
        clearHover();
    });

    // Leaf Hover Logic
    leafNodes.append("rect")
        .attr("x", d => d.renderX < 0 ? -120 : 0)
        .attr("y", -12).attr("width", 120).attr("height", 24).attr("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            clearHover();
            const ancestors = d.ancestors();
            link.classed("link--active", l => ancestors.includes(l.source) && ancestors.includes(l.target));
            node.classed("node--active", n => ancestors.includes(n));

            internalNodes.filter(n => ancestors.includes(n))
                .select(".internal-text")
                .text(n => {
                    const val = getLeafValueAtDepth(d, n.originalDepth, currentModel);
                    return `${d.data.name} (${formatValue(val, currentModel)})`;
                });
        })
        .on("mouseout", clearHover);

    // Internal Hitbox Logic
    internalNodes.append("circle")
        .attr("r", 18) 
        .style("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            clearHover();
            const descendants = d.descendants();
            link.classed("link--active", l => descendants.includes(l.source) && descendants.includes(l.target));
            node.classed("node--active", n => descendants.includes(n));

            internalNodes.filter(n => descendants.includes(n))
                .select(".internal-text")
                .text(n => {
                    const w = getWinner(n, currentModel);
                    return `${w.name} (${formatValue(w.value, currentModel)})`;
                });

            // Resume Justice WAB Coloration
            if (d.originalDepth === 0 && currentModel === 'wab') {
                leafNodes.select("text").style("fill", p => {
                    const seedMatch = p.data.name.match(/\d+/);
                    const seed = seedMatch ? parseInt(seedMatch[0]) : 0;
                    const delta = (p.data.wab || 0) - (seedAverages[seed] || 0);
                    
                    if (delta >= 2.0) return "#27ae60"; 
                    if (delta <= -2.0) return "#e74c3c"; 
                    return "#333"; 
                });
            }
        })
        .on("mouseout", clearHover);
});