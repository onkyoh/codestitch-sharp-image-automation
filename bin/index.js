#!/usr/bin/env node
// bin/index.js

const optimizer = require("../lib");
const args = process.argv.slice(2);

// Parse command line options
const options = {
	baseUrl: "http://localhost:8080",
	outputDir: "./image-optimizations",
	contentDir: "./src/content",
	autoStartServer: true,
	forceRun: false,
	targetPage: null,
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
	if (args[i] === "--base-url" && i + 1 < args.length) {
		options.baseUrl = args[i + 1];
		i++;
	} else if (args[i] === "--output-dir" && i + 1 < args.length) {
		options.outputDir = args[i + 1];
		i++;
	} else if (args[i] === "--content-dir" && i + 1 < args.length) {
		options.contentDir = args[i + 1];
		i++;
	} else if (args[i] === "--target" && i + 1 < args.length) {
		options.targetPage = args[i + 1];
		i++;
	} else if (args[i] === "--help" || args[i] === "-h") {
		console.log(`
CodeStitch Image Optimizer
--------------------------
Automatically optimize images for the CodeStitch Sharp Images plugin.

Usage:
  codestitch-optimize [options]

Options:
  --base-url URL         Development server URL (default: http://localhost:8080)
  --output-dir DIR       Output directory for optimized markup (default: ./image-optimizations)
  --content-dir DIR      Directory containing HTML/Nunjucks content files (default: ./src/content)
  --target PAGE          Specific page to optimize (e.g., home, about, services/tile-installation)
  --help, -h             Show this help message

Examples:
  codestitch-optimize                         # Optimize all pages
  codestitch-optimize --target home           # Optimize only the home page (index.html)
  codestitch-optimize --target about          # Optimize only the about page
  codestitch-optimize --target services/tile-installation   # Optimize only the tile-installation page
    `);
		process.exit(0);
	}
}

// Run the optimizer
optimizer.run(options).catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
