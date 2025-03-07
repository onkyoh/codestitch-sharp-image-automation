# codestitch-sharp-image-automation

A tool that renders your [CodeStitch](https://codestitch.app/app) website and automatically takes responsive measurements of your images to creates [sharp image](https://www.npmjs.com/package/@codestitchofficial/eleventy-plugin-sharp-images) compatible code snippets.

## Table of Contents

-   [Features](#features)
-   [Installation](#installation)
-   [Configuration](#configuration)
-   [Usage](#usage)
    -   [Command Options](#command-options)
    -   [Examples](#examples)
-   [How It Works](#how-it-works)
-   [Optimization Strategy](#optimization-strategy)
-   [Special Thanks](#special-thanks)

<a href="#features"></a>

## Features

1. Scans your website pages and analyzes all picture elements at different viewport sizes
2. Automatically determines optimal image dimensions for mobile, tablet, and desktop breakpoints
3. Generates optimized picture markup with responsive srcsets for avif, webp, and jpeg formats
4. Preserves image classes, alt text, and other attributes
5. Works seamlessly with 11ty/Nunjucks templates and CodeStitch Sharp Images plugin

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
  --help, -h           Show this help message
```

## How It Works

The tool performs the following steps:

1. **Scanning**: Recursively scans your content directory for HTML files and extracts permalinks from frontmatter
2. **Measurement**: Uses Playwright to render each page at different viewport sizes:
    - Mobile (320×675px)
    - Tablet (1024×800px)
    - Desktop (1920×1080px)
3. **Analysis**: Measures the rendered dimensions of each image at each breakpoint
4. **Optimization**: Generates picture elements with:
    - Properly sized images for each breakpoint
    - Appropriate `srcset` attributes for modern formats (avif, webp, jpeg)
    - All original attributes (class, alt, loading, etc.) preserved
5. **Output**: Saves the generated markup to files in the output directory, organized by page
    - Each file is named based on the page's permalink (e.g., `about.html`, `blog-post-1.html`)
    - This naming convention ensures unique filenames for each page, even with nested routes
    - Permalinks with slashes are converted to hyphens (e.g., `blog/post-1/` becomes `blog-post-1.html`)

## Requirements

-   Node.js >=14.0.0
