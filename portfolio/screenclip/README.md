# Website Screenshotter

A Node.js program that loads a website and takes screenshots of the main pages linked from the homepage.

## Installation

1. Make sure you have Node.js installed (version 14 or higher).
2. Clone or download this project.
3. Run `npm install` to install dependencies.

## Usage

Run the program with a website URL as an argument:

```bash
node index.js https://example.com
```

If no URL is provided, it defaults to `https://rosoi.webflow.io`.

The program will:
1. Load the homepage of the specified website.
2. Extract all internal links from the page.
3. Navigate to each unique internal link and take a full-page screenshot.
4. Save screenshots in the `screenshots/` directory with filenames based on the page title.

## Example

```bash
node index.js https://rosoi.webflow.io
```

This will create screenshots for all main pages linked from the Rosoi Webflow site.

## Dependencies

- [Puppeteer](https://pptr.dev/) - For browser automation and screenshotting.

## Troubleshooting

- Ensure you have sufficient disk space for screenshots.
- If the website has many links, the process may take some time.
- Some pages might fail to load due to network issues or site restrictions.
- Screenshots are saved as PNG files in the `screenshots` folder.