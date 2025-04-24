// lib/index.js
const scanner = require("./scanner");
const fs = require("fs").promises;
const path = require("path");

async function run(options) {
	console.log(`🚀 CodeStitch Image Optimizer`);
	console.log(`  Base URL: ${options.baseUrl}`);
	console.log(`  Output directory: ${options.outputDir}`);

	if (options.targetPage) {
		console.log(`  Target page: ${options.targetPage}`);
	}

	// Make paths absolute
	const contentDir = path.resolve(process.cwd(), options.contentDir);
	const outputDir = path.resolve(process.cwd(), options.outputDir);

	// Create output directory if it doesn't exist
	await fs.mkdir(outputDir, { recursive: true });

	// Scan pages and optimize images
	const results = await scanner.scanProject({
		contentDir,
		outputDir,
		baseUrl: options.baseUrl,
		targetPage: options.targetPage,
	});

	return results;
}

module.exports = { run };
