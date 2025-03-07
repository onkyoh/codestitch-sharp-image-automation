#!/usr/bin/env node
// bin/codestitch-optimize.js

const optimizer = require("../lib");
const args = process.argv.slice(2);

// Parse command line options
const options = {
	baseUrl: "http://localhost:8080",
	outputDir: "./image-optimizations",
	contentDir: "./src/content",
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
	if (args[i] === "--base-url" && i + 1 < args.length) {
		options.baseUrl = args[i + 1];
		i++;
	} else if (args[i] === "--output-dir" && i + 1 < args.length) {
		options.outputDir = args[i + 1];
		i++;
	} else if (args[i] === "--help" || args[i] === "-h") {
		console.log(`
CodeStitch Image Optimizer
--------------------------
Automatically optimize images for the CodeStitch Sharp Images plugin.

Usage:
  codestitch-optimize [options]

Options:
  --base-url URL       Development server URL (default: http://localhost:8080)
  --output-dir DIR     Output directory for optimized markup (default: ./image-optimizations)
  --help, -h           Show this help message
    `);
		process.exit(0);
	}
}

// Run the optimizer
optimizer.run(options).catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
