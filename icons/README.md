# Icons Directory

This directory should contain the extension icons in PNG format:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Creating Icons

### Option 1: Use the SVG template
1. Open `icon.svg` in any design tool (Figma, Inkscape, etc.)
2. Export as PNG at the required sizes

### Option 2: Use online tools
1. Visit https://www.favicon-generator.org/
2. Upload a square image
3. Download the generated icons
4. Rename them to match the required names

### Option 3: Generate from SVG (if you have imagemagick)
```bash
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

## Temporary Solution

For testing, the extension will work without custom icons - Chrome will use a default puzzle piece icon. Add proper icons before publishing to the Chrome Web Store.

## Design Notes

The current SVG icon shows:
- Blue background (#4285f4 - Google Blue)
- White clock face
- Clock hands pointing to approximately 2:30
- Represents "scheduled" or "timed" functionality
