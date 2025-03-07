// Function to generate picture element markup based on measurements
function generatePictureMarkup(id, data) {
	const { original, pictureClass, measurements } = data;

	// Extract image path from src - convert to /assets path format
	const imgSrc = original.src.includes("/assets/") ? "/assets/" + original.src.split("/assets/")[1] : original.src;
	const imgAlt = original.alt || "";

	// Start building markup
	let markup = `<picture${pictureClass ? ` class="${pictureClass}"` : ""}>\n`;

	// Breakpoint configurations
	const breakpointMap = {
		"320x675": { name: "Mobile", mediaQuery: "(max-width: 600px)" },
		"1024x800": { name: "Tablet", mediaQuery: "(max-width: 1024px)" },
		"1920x1080": { name: "Desktop", mediaQuery: "(min-width: 1024px)" },
	};

	// Add mobile, tablet, and desktop sources in order
	const orderedBreakpoints = ["320x675", "1024x800", "1920x1080"];

	for (const bp of orderedBreakpoints) {
		if (!measurements[bp] || !measurements[bp].scaled) continue;

		const { width, height } = measurements[bp].scaled;
		const breakpointInfo = breakpointMap[bp];

		// Add comment for each breakpoint
		markup += `\t<!--${breakpointInfo.name} Image-->\n`;

		// Add sources for avif, webp, and jpeg
		markup += `\t<source media="${breakpointInfo.mediaQuery}" srcset="{% getUrl "${imgSrc}" | resize({ width: ${width}, height: ${height} }) | avif %}" type="image/avif">\n`;
		markup += `\t<source media="${breakpointInfo.mediaQuery}" srcset="{% getUrl "${imgSrc}" | resize({ width: ${width}, height: ${height} }) | webp %}" type="image/webp">\n`;
		markup += `\t<source media="${breakpointInfo.mediaQuery}" srcset="{% getUrl "${imgSrc}" | resize({ width: ${width}, height: ${height} }) | jpeg %}" type="image/jpeg">\n`;
	}

	// Get desktop dimensions for the fallback image
	const desktopMeasurements = measurements["1920x1080"];
	const fallbackWidth = desktopMeasurements?.original?.width;
	const fallbackHeight = desktopMeasurements?.original?.height;
	const scaledWidth = desktopMeasurements?.scaled?.width;
	const scaledHeight = desktopMeasurements?.scaled?.height;

	// Add fallback image
	markup += `\t<img src="{% getUrl "${imgSrc}" | resize({ width: ${scaledWidth}, height: ${scaledHeight} }) | jpeg %}" alt="${imgAlt}" width="${fallbackWidth}" height="${fallbackHeight}" loading="lazy" decoding="async">\n`;

	markup += `</picture>`;
	return markup;
}

module.exports = { generatePictureMarkup };
