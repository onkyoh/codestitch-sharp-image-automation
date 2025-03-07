const fs = require("fs").promises;
const path = require("path");
const yaml = require("js-yaml");
const { chromium } = require("playwright-chromium");
const generator = require("./generator");

// Define breakpoints to measure
const breakpoints = [
	{ width: 320, height: 675 },
	{ width: 1024, height: 800 },
	{ width: 1920, height: 1080 },
];

// Maximum width for scaled images
const MAX_SCALED_WIDTH = 2500;

// Function to find all HTML files in the content directory
async function findHtmlFiles(dir, fileList = []) {
	try {
		const files = await fs.readdir(dir, { withFileTypes: true });

		for (const file of files) {
			const filePath = path.join(dir, file.name);

			if (file.isDirectory()) {
				// Recursively scan subdirectories
				await findHtmlFiles(filePath, fileList);
			} else if (file.name.endsWith(".html") || file.name.endsWith(".njk")) {
				fileList.push(filePath);
			}
		}
	} catch (error) {
		console.error(`Error scanning directory ${dir}:`, error);
	}

	return fileList;
}

// Function to extract permalink from frontmatter
async function extractPermalink(filePath) {
	try {
		const content = await fs.readFile(filePath, "utf8");

		// Split content into lines
		const lines = content.split(/\r?\n/);

		// Find the line with 'permalink:'
		const permalinkLine = lines.find((line) => line.includes("permalink:"));

		if (permalinkLine) {
			// Extract text between quotes (single or double)
			const match = permalinkLine.match(/['"]([^'"]+)['"]/);

			if (match) {
				let permalink = match[1];

				// Ensure permalink starts and ends with a slash
				permalink = permalink.startsWith("/") ? permalink : "/" + permalink;
				permalink = permalink.endsWith("/") ? permalink : permalink + "/";

				console.log(`  Found permalink in frontmatter: ${permalink}`);
				return permalink;
			}
		}

		console.log(`  No permalink found in frontmatter for ${filePath}`);
		return null;
	} catch (error) {
		console.error(`Error reading file ${filePath}:`, error);
		return null;
	}
}

// Function to measure images on a page
async function measureImagesOnPage(url, pageName, outputDir) {
	console.log(`\n  📐 Measuring images on ${url}`);

	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		// Navigate to the page
		await page.goto(url, { waitUntil: "networkidle" });
		console.log("  Page loaded successfully");

		// Find all picture elements
		const allPictureElements = await page.$$("picture");
		console.log(`  Found ${allPictureElements.length} total picture elements`);

		// Measure each picture at each breakpoint
		const results = {};
		let processedCount = 0;

		for (let i = 0; i < allPictureElements.length; i++) {
			const picture = allPictureElements[i];

			// Get image element
			const imgElement = await picture.$("img");
			if (!imgElement) {
				continue;
			}

			// Filter out if image is SVG
			const imgSrc = await imgElement.getAttribute("src");
			if (imgSrc && imgSrc.toLowerCase().endsWith(".svg")) {
				continue;
			}

			// Get picture class
			const pictureClass = await picture.evaluate((pic) => pic.className || "");

			// Get image information
			const imgInfo = await imgElement.evaluate((img) => {
				return {
					src: img.src,
					alt: img.alt || "",
					id: img.id || "",
				};
			});

			// Use an iterating image count as a uniuqe identifier
			const id = `image-${i}`;

			results[id] = {
				original: imgInfo,
				pictureClass: pictureClass,
				measurements: {},
			};

			processedCount++;

			// Measure at each breakpoint
			for (const bp of breakpoints) {
				// Resize viewport
				await page.setViewportSize(bp);

				// Wait for responsive adjustments
				await page.waitForTimeout(300);

				// Measure the image
				const size = await imgElement
					.evaluate((img) => {
						const rect = img.getBoundingClientRect();
						return {
							width: Math.round(rect.width),
							height: Math.round(rect.height),
						};
					})
					.catch(() => null);

				if (size) {
					// Apply scaling logic
					let scaledWidth = size.width * 2;
					let scaledHeight = size.height * 2;

					// If width exceeds MAX_SCALED_WIDTH, cap it and adjust height proportionally
					if (scaledWidth > MAX_SCALED_WIDTH) {
						const scaleFactor = MAX_SCALED_WIDTH / scaledWidth;
						scaledWidth = MAX_SCALED_WIDTH;
						scaledHeight = Math.round(scaledHeight * scaleFactor);
					}

					// Store original and scaled measurements
					results[id].measurements[`${bp.width}x${bp.height}`] = {
						original: { width: size.width, height: size.height },
						scaled: { width: scaledWidth, height: scaledHeight },
					};
				}
			}
		}

		// Generate markup for this page
		if (Object.keys(results).length > 0) {
			let allMarkup = "";

			for (const [id, data] of Object.entries(results)) {
				const markup = generator.generatePictureMarkup(id, data);
				allMarkup += markup + "\n\n";
			}

			// Create directory structure that mirrors the content structure
			// Create directories if needed
			const outputDirPath = path.dirname(path.join(outputDir, pageName));
			await fs.mkdir(outputDirPath, { recursive: true });

			// Save the file
			const outputFilePath = path.join(outputDir, pageName);
			await fs.writeFile(outputFilePath, allMarkup, "utf8");
			console.log(`  ✅ Optimized ${processedCount} images. Saved to ${outputFilePath}`);

			return {
				pageUrl: url,
				imageCount: processedCount,
				outputPath: outputFilePath,
			};
		} else {
			console.log(`  ⚠️ No images found on this page`);
			return {
				pageUrl: url,
				imageCount: 0,
				outputPath: null,
			};
		}
	} catch (error) {
		console.error(`  ❌ Error optimized page ${url}:`, error);
		return {
			pageUrl: url,
			error: error.message,
			imageCount: 0,
			outputPath: null,
		};
	} finally {
		await browser.close();
	}
}

// Main function to scan the project and process pages
async function scanProject(options) {
	try {
		console.log(`🔍 Scanning content directory: ${options.contentDir}`);

		// Find all HTML files in the content directory
		const htmlFiles = await findHtmlFiles(options.contentDir);
		console.log(`  Found ${htmlFiles.length} HTML files`);

		// Create a list of pages to process
		const pageList = [];

		// Process HTML files from content directory
		for (const filePath of htmlFiles) {
			const permalink = await extractPermalink(filePath);

			if (permalink) {
				// For the output path: remove leading/trailing slashes and replace inner slashes with hyphens
				const outputName = permalink.replace(/^\/|\/$/g, "").replace(/\//g, "-") + ".html";

				pageList.push({
					filePath: filePath,
					permalink: permalink,
					pageName: outputName,
					url: `${options.baseUrl}${permalink}`,
				});
			}
		}

		// Manually add index page
		pageList.push({
			filePath: "index.html",
			permalink: "/",
			pageName: "index.html",
			url: `${options.baseUrl}/`,
		});

		console.log(`\n📋 Pages to process: ${pageList.length}`);
		console.log(`  Pages found:`);
		pageList.forEach((page, index) => {
			console.log(`  ${index + 1}. ${page.url} (output: ${page.pageName})`);
		});

		// Process each page
		const results = [];

		for (let i = 0; i < pageList.length; i++) {
			const page = pageList[i];
			console.log(`\n🛠️ Processing page ${i + 1}/${pageList.length}: ${page.permalink}`);

			const result = await measureImagesOnPage(page.url, page.pageName, options.outputDir);
			results.push(result);
		}

		// Generate summary report
		const successCount = results.filter((r) => r.imageCount > 0).length;
		const totalImages = results.reduce((sum, r) => sum + r.imageCount, 0);
		const errorCount = results.filter((r) => r.error).length;

		console.log(`\n🏁 Project scan complete!`);
		console.log(`  Total pages scanned: ${results.length}`);
		console.log(`  Pages with images: ${successCount}`);
		console.log(`  Total images processed: ${totalImages}`);
		console.log(`  Pages with errors: ${errorCount}`);
		console.log(`  Optimized image markup saved to: ${options.outputDir}`);

		return {
			totalPages: results.length,
			pagesWithImages: successCount,
			totalImages: totalImages,
			pagesWithErrors: errorCount,
			outputDir: options.outputDir,
		};
	} catch (error) {
		console.error("❌ Error scanning project:", error);
		throw error;
	}
}

module.exports = { scanProject };
