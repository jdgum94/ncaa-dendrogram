# NCAA Tournament Probability Explorer

An interactive, bracket dendrogram visualizing the paths and probabilities for the 2026 NCAA Men's Basketball Tournament.

This project maps the entire 64-team tournament field into a circular hierarchy. By hovering over any team on the perimeter, the visualization instantly traces their specific path to the national championship, dynamically displaying their probability of advancing through each round.

* **KP** - KenPom publicly released tournament probabilities.
* **EM(i)** - Evan Miya publicly released tournament probabilities (injury adjusted, beware).
* **BT** - Bart Torvik publicly released tournament probabilities.
* **BT(l10)** - Bart Torvik publicly released tournament probabilities filtered to last 10 games.
* **BT(t100)** - Bart Torvik publicly released tournament probabilities filtered to vs. top 100 teams only.
* **WAB** - WAB value comparison.
* **NET** - NET ranking comparison.

## Features
* **Multiple Projection Models** - Includes a dropdown toggle to switch seamlessly between **KP**, **EM(i)**, **BT**, **BT(l10)**, **BT(t100)**, **WAB** and **NET** probability data.
* **Interactive Path Tracing** - Hovering over a leaf node (team) highlights their route to the final. Hovering over an internal node (future game) completes the bracket up to that node. Calculations use the selected model.
* **Resume Mis-seeding** - Center dot selection highlights low and high value seeds according to seed-relative WAB (WAB model only).
* **Zero-Build Architecture** - No Webpack, Node modules, or complex build steps. Just pure HTML, CSS, and D3.js.

## Tech Stack
* **HTML5 / CSS3** (Vanilla)
* **JavaScript** (ES6)
* **D3.js (v7)** - Used for calculating the radial cluster coordinates, generating the SVG bezier curves, and handling the DOM state transitions.
