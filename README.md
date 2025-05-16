# codestitch-sharp-image-automation

A tool that renders your [CodeStitch](https://codestitch.app/app) website and automatically takes responsive measurements of your images to creates [sharp image](https://www.npmjs.com/package/@codestitchofficial/eleventy-plugin-sharp-images) compatible code snippets.

<a href="#features"></a>

## Features

1. Scans your website pages and analyzes all picture elements at different viewport sizes
2. Automatically determines optimal image dimensions for mobile, tablet, and desktop breakpoints
3. Generates optimized picture markup with responsive srcsets for avif, webp, png, and jpeg formats
4. Preserves image classes, alt text, and other attributes
5. Works seamlessly with 11ty/Nunjucks templates and CodeStitch Sharp Images plugin
6. Allows targeting specific pages for optimization

## Usage

Run the CLI tool while the root of your CodeStitch project:

```bash
npx run-sharp-automation
```

> [!CAUTION]
> Your project must be running in a separate terminal at the URL specified in the `--base-url` option (default: http://localhost:8080) before running this tool. The tool needs to access your live pages to analyze images.

<a href="#command-options"></a>

### Command Options

```
Usage:
npx run-sharp-automation [options]

Options:
  --base-url URL       Development server URL (default: http://localhost:8080)
  --output-dir DIR     Output directory for optimized markup (default: ./image-optimizations)
  --content-dir DIR    Directory containing HTML/Nunjucks content files (default: ./src/content)
  --target PAGE        Specific page to optimize (e.g., home, about, services/service-name)
  --help, -h           Show this help message
```

### Examples

```bash
# Optimize all pages
npx run-sharp-automation

# Optimize only the home page (index.html)
npx run-sharp-automation --target home

# Optimization only targets /src/content/pages/about.html
npx run-sharp-automation --target about

# Optimization only targets /src/content/pages/services/tile-installation.html
npx run-sharp-automation --target services/tile-installation
```

## How It Works

The tool performs the following steps:

1. **Scanning**: Recursively scans your content directory for HTML files and extracts permalinks from frontmatter
    - When using `--target`, only processes the specified page
2. **Measurement**: Uses Playwright to render each page at different viewport sizes:
    - Mobile (320×700px)
    - Tablet (1024×800px)
    - Desktop (1920×1080px)
3. **Analysis**: Measures the rendered dimensions of each image at each breakpoint
    - Detects which images are above-the-fold in the mobile viewport
    - Sets minimum dimensions of 1×1px for hidden or zero-sized elements
    - For some stitches Parallax is achieved by rendering images with CSS, in this scenario the plugin generates 2 Desktop measurements, 1024-1600px and 1600px+. The latter is given 1x1px for its dimensions.
4. **Optimization**: Generates picture elements with:
    - Properly sized images for each breakpoint
    - Appropriate `srcset` attributes for modern formats (avif, webp, jpeg)
    - Preload links for above-the-fold images to improve page load performance
    - No `loading="lazy"` attribute for above-the-fold images (added to below-fold images)
    - All other original attributes (class, alt, etc.) preserved
5. **Output**: Saves the generated markup to files in the output directory, organized by page
    - Each file is named based on the page's permalink (e.g., `about.html`, `blog-post-1.html`)
    - This naming convention ensures unique filenames for each page, even with nested routes
    - Permalinks with slashes are converted to hyphens (e.g., `blog/post-1/` becomes `blog-post-1.html`)

## Requirements

-   Node.js >=14.0.0
