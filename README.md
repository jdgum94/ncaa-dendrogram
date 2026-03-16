# NCAA Tournament Probability Explorer

An interactive, radial dendrogram visualizing the paths and probabilities for the 2026 NCAA Men's Basketball Tournament. 

This project maps the entire 64-team tournament field into a circular hierarchy. By hovering over any team on the perimeter, the visualization instantly traces their specific path to the national championship, dynamically displaying their probability of advancing through each round.

* **KP** KenPom publicly released tournament probabilities.
* **EM(i)** Evan Miya publicly released tournament probabilities (injury adjusted, beware).
* **BT** Bart Torvik publicly released tournament probabilities.
* **WAB** WAB value.

## Features
* **Multiple Projection Models:** Includes a dropdown toggle to switch seamlessly between **KP**, **EM(i)**, **BT**, and **WAB** probability data.
* **Interactive Path Tracing:** Hovering over a leaf node (team) highlights their route to the center. Hovering over an internal node (future game) highlights all teams still eligible to reach that spot.
* **Chalk Tooltip** Hovering over internal node displays a max 3-level depth bracket representation showing the results according to the chosen model; WAB is simply a direct comparison.
* **Zero-Build Architecture:** No Webpack, Node modules, or complex build steps. Just pure HTML, CSS, and D3.js.

## Tech Stack
* **HTML5 / CSS3** (Vanilla)
* **JavaScript** (ES6)
* **D3.js (v7)** - Used for calculating the radial cluster coordinates, generating the SVG bezier curves, and handling the DOM state transitions.
