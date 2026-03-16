const width = 900;
const height = 900;
const radius = width / 2 - 150; 

const svg = d3.select("#bracket-container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width/2},${height/2})`);

const offset = 290;

const regionLabels = [
    { name: "West",    x: -offset, y: -offset }, 
    { name: "Midwest", x: -offset, y: offset },  
    { name: "East",    x: offset,  y: -offset }, 
    { name: "South",   x: offset,  y: offset }   
];

svg.selectAll(".region-label")
    .data(regionLabels)
    .enter().append("text")
    .attr("class", "region-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(d => d.name);

const tree = d3.cluster().size([2 * Math.PI, radius]);
let currentModel = document.getElementById("dataSource").value;
const depthToProb = {5: 'R32', 4: 'S16', 3: 'E8', 2: 'F4', 1: 'F2', 0: 'Champ'};

// --- SEED STRENGTH HEURISTICS ---
// Average WAB achievement for each seed line
const seedAverages = {
    1: 8.5, 2: 7.0, 3: 5.5, 4: 4.5, 5: 3.5, 6: 2.8, 7: 2.0, 8: 1.5,
    9: 1.0, 10: 0.5, 11: 0.1, 12: -0.5, 13: -1.5, 14: -2.5, 15: -3.5, 16: -4.5
};

function getWinner(d, model) {
    const leaves = d.leaves();
    const probKey = depthToProb[d.depth];
    let winnerName = "";
    let maxVal = -Infinity;
    leaves.forEach(leaf => {
        let val = (model === 'wab') ? (leaf.data.wab || 0) : ((leaf.data[model] && leaf.data[model][probKey]) ? leaf.data[model][probKey] : 0);
        if (val > maxVal) { maxVal = val; winnerName = leaf.data.name; }
    });
    return { name: winnerName, value: maxVal };
}

function buildChalkData(mainNode, model, maxDepth, currentDepth = 0) {
    const winnerObj = getWinner(mainNode, model);
    const winner = winnerObj.name;
    const val = winnerObj.value; 
    
    if (!mainNode.children || currentDepth >= maxDepth) {
        return { name: winner, value: val };
    }
    return {
        name: winner,
        value: val, 
        children: mainNode.children.map(c => buildChalkData(c, model, maxDepth, currentDepth + 1))
    };
}

d3.json("data.json").then(data => {
    const root = tree(d3.hierarchy(data));

    const link = svg.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial().angle(d => d.x).radius(d => d.y));

    const node = svg.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

    const internalNodes = node.filter(d => d.children);
    internalNodes.append("circle").attr("r", 4).style("cursor", "pointer");

    const leafNodes = node.filter(d => !d.children);
    leafNodes.append("text").attr("dy", "0.31em").attr("x", d => d.x < Math.PI ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .text(d => d.data.name);

    const hoverLayer = svg.append("g").attr("class", "hover-layer");

    function clearHover() {
        link.classed("link--active", false);
        node.classed("node--active", false);
        leafNodes.selectAll("text").style("fill", "#000"); // Reset colors
        hoverLayer.selectAll("*").remove();
        d3.select("#chalk-tooltip").style("opacity", 0); 
    }

    d3.select("#dataSource").on("change", function() {
        currentModel = this.value;
        clearHover();
    });

    // LEAF HOVER
    leafNodes.append("rect")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .attr("x", d => d.x < Math.PI ? 0 : -110)
        .attr("y", -12).attr("width", 110).attr("height", 24).attr("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            clearHover();
            const ancestors = d.ancestors();
            link.classed("link--active", l => ancestors.includes(l.source) && ancestors.includes(l.target));
            node.classed("node--active", n => ancestors.includes(n));

            if (currentModel === 'wab') {
                const value = d.data.wab;
                if (value !== undefined) {
                    hoverLayer.append("text").attr("class", "prob-label")
                        .attr("transform", () => {
                            const isLeft = d.x >= Math.PI;
                            const angle = d.x * 180 / Math.PI - 90;
                            return `rotate(${angle}) translate(${radius - 15},0) ${isLeft ? "rotate(180)" : ""}`;
                        })
                        .attr("text-anchor", d.x < Math.PI ? "end" : "start")
                        .attr("dy", "0.31em").text(value);
                }
            } else {
                const modelData = d.data[currentModel];
                if (modelData) {
                    const probMapping = [
                        { node: ancestors[1], value: modelData.R32 }, { node: ancestors[2], value: modelData.S16 },
                        { node: ancestors[3], value: modelData.E8 }, { node: ancestors[4], value: modelData.F4 },
                        { node: ancestors[5], value: modelData.F2 }, { node: ancestors[6], value: modelData.Champ }
                    ];

                    hoverLayer.selectAll(".prob-label").data(probMapping.filter(p => p.node && p.value !== undefined))
                        .join("text").attr("class", "prob-label")
                        .attr("transform", p => `translate(${p.node.y * Math.cos(p.node.x - Math.PI / 2)},${p.node.y * Math.sin(p.node.x - Math.PI / 2) - 10})`)
                        .attr("text-anchor", "middle").text(p => p.value + "%");
                }
            }
        })
        .on("mouseout", clearHover);

    // INTERNAL HOVER
    internalNodes.select("circle")
        .on("mouseover", function(event, d) {
            clearHover();
            const descendants = d.descendants();
            link.classed("link--active", l => descendants.includes(l.source) && descendants.includes(l.target));
            node.classed("node--active", n => descendants.includes(n));

            // --- SEED STRENGTH COLORATION (Center Dot Only + WAB Only) ---
            if (d.depth === 0 && currentModel === 'wab') {
                leafNodes.selectAll("text").style("fill", p => {
                    const seed = parseInt(p.data.name.match(/\d+/));
                    const wab = p.data.wab || 0;
                    const expected = seedAverages[seed] || 0;
                    const delta = wab - expected;

                    if (delta >= 2.0) return "#27ae60"; // Strong Green (Underseeded)
                    if (delta <= -2.0) return "#e74c3c"; // Strong Red (Overseeded)
                    return "#000"; // Neutral
                });
            }

            const probKey = depthToProb[d.depth];

            if (probKey || currentModel === 'wab') {
                const leaves = d.leaves();
                
                hoverLayer.selectAll(".prob-label-pct").data(leaves).join("text").attr("class", "prob-label-pct")
                    .attr("transform", p => `rotate(${p.x * 180 / Math.PI - 90}) translate(${radius - 15},0) ${p.x >= Math.PI ? "rotate(180)" : ""}`)
                    .attr("text-anchor", p => p.x < Math.PI ? "end" : "start").attr("dy", "0.31em")
                    .style("font-size", "11px").style("font-weight", "bold").style("fill", "#0000ee")
                    .text(p => currentModel === 'wab' ? (p.data.wab !== undefined ? p.data.wab : "") : ((p.data[currentModel] && p.data[currentModel][probKey] !== undefined) ? p.data[currentModel][probKey] + "%" : ""));

                const maxDepth = d.height > 3 ? 3 : d.height; 
                const chalkTreeData = buildChalkData(d, currentModel, maxDepth);
                const miniRoot = d3.hierarchy(chalkTreeData);
                
                const miniMargin = { top: 10, right: 150, bottom: 10, left: 110 };
                const miniW = Math.max(40, miniRoot.height * 40); 
                const miniH_calc = Math.max(40, miniRoot.leaves().length * 24); 
                
                const tooltipWidth = miniW + miniMargin.left + miniMargin.right + 24; 
                const tooltipHeight = miniH_calc + miniMargin.top + miniMargin.bottom + 40; 

                let posX, posY;
                const isRightHalf = d.x < Math.PI;

                if (d.depth === 0) {
                    posX = event.pageX - (tooltipWidth / 2);
                    posY = event.pageY - (tooltipHeight / 2);
                } else if (d.depth === 1) {
                    posX = event.pageX + (isRightHalf ? -(tooltipWidth + 15) : 15);
                    posY = event.pageY - (tooltipHeight / 2);
                } else {
                    const isBottomHalf = d.x > Math.PI / 2 && d.x < 3 * Math.PI / 2;
                    posX = event.pageX + (isRightHalf ? -(tooltipWidth + 15) : 15);
                    posY = event.pageY + (isBottomHalf ? -(tooltipHeight + 15) : 15);
                }

                const tt = d3.select("#chalk-tooltip");
                tt.html(`<div style="font-size: 10px; font-weight: bold; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Projected Sub-Bracket</div>`);
                tt.style("opacity", 1).style("left", posX + "px").style("top", posY + "px");

                const miniSvg = tt.append("svg")
                    .attr("width", miniW + miniMargin.left + miniMargin.right)
                    .attr("height", miniH_calc + miniMargin.top + miniMargin.bottom);
                    
                const miniG = miniSvg.append("g").attr("transform", `translate(${miniMargin.left}, ${miniMargin.top})`);
                d3.tree().size([miniH_calc, miniW])(miniRoot);

                miniG.selectAll(".mini-link").data(miniRoot.links()).join("path").attr("class", "mini-link")
                    .attr("d", d3.linkHorizontal().x(p => miniW - p.y).y(p => p.x));

                const miniNodes = miniG.selectAll(".mini-node").data(miniRoot.descendants()).join("g")
                    .attr("class", "mini-node")
                    .classed("mini-node--root", p => p.depth === 0)
                    .attr("transform", p => `translate(${miniW - p.y},${p.x})`);
                    
                miniNodes.append("text")
                    .attr("dy", p => !p.children ? "0.31em" : (p.depth === 0 ? "0.31em" : "-0.5em"))
                    .attr("x", p => !p.children ? -6 : (p.depth === 0 ? 6 : 0))
                    .attr("text-anchor", p => !p.children ? "end" : (p.depth === 0 ? "start" : "middle"))
                    .text(p => {
                        if (p.depth === 0 && p.data.value !== undefined) {
                            return p.data.name + (currentModel === 'wab' ? ` (${p.data.value})` : ` (${p.data.value}%)`);
                        }
                        return p.data.name;
                    });
            }
        })
        .on("mouseout", clearHover);
});