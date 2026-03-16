# NCAA Tournament Probability Explorer

An interactive, radial dendrogram visualizing the paths and probabilities for the 2026 NCAA Men's Basketball Tournament. 

This project maps the entire 64-team tournament field into a circular hierarchy. By hovering over any team on the perimeter, the visualization instantly traces their specific path to the national championship, dynamically displaying their probability of advancing through each round.

## Features
* **Interactive Path Tracing:** Hovering over a leaf node (team) highlights their route to the center. Hovering over an internal node (future game) highlights all teams still eligible to reach that spot.
* **Dual Projection Models:** Includes a dropdown toggle to switch seamlessly between **KenPom** and **EvanMiya** probability data.
* **Zero-Build Architecture:** No Webpack, Node modules, or complex build steps. Just pure HTML, CSS, and D3.js.

## Tech Stack
* **HTML5 / CSS3** (Vanilla)
* **JavaScript** (ES6)
* **D3.js (v7)** - Used for calculating the radial cluster coordinates, generating the SVG bezier curves, and handling the DOM state transitions.

## Running Locally (macOS / Linux)

Because browsers enforce strict CORS policies that block local JavaScript from fetching JSON files directly from your hard drive, you will need to serve the files through a lightweight local web server. 

macOS comes with Python pre-installed, making this a one-line process:

1. Open your Terminal.
2. Navigate to the project directory:
   ```bash
   cd path/to/your/repository