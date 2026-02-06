# Local Media Hub

A self-hosted media library for browsing and managing your local images and videos. Features a clean, modern interface with folder navigation, search, tagging, and a lightbox viewer.

## Features

- **Dual view modes** - Browse your library organized by Title or by Category
- **Search** - Find files by name, tags, title, or category
- **Lightbox viewer** - Full-screen media viewing with video playback
- **Media management** - Edit display names, titles, categories, and tags
- **Bulk editing** - Select multiple items to tag or categorize them all at once
- **Cover images** - Set custom cover images for folders
- **File upload** - Add new media directly through the interface
- **Library scanning** - Automatically discover new files in your media directory
- **Preview mode** - Frontend works standalone with mock data when server is unavailable
- **Dark mode** - Toggle between light and dark themes (respects system preference)

## Requirements

- Python 3.7+
- Flask

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/local-media-library.git
   cd local-media-library
   ```

2. Install dependencies:
   ```bash
   pip install flask
   ```

3. Create your configuration file:
   ```bash
   cp config.example.json config.json
   ```

4. Edit `config.json` to set your media folder path (see [Configuration](#configuration))

5. Start the server:
   ```bash
   python assets/py/media_server.py
   ```

6. Open http://127.0.0.1:5000 in your browser

## Configuration

All settings are managed in `config.json`. Copy `config.example.json` to get started.

```json
{
    "server": {
        "host": "127.0.0.1",
        "port": 5000,
        "debug": true
    },
    "paths": {
        "media_folder": "/path/to/your/media/folder",
        "db_folder": "assets/db"
    },
    "supported_formats": {
        "images": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
        "videos": [".mp4", ".mov", ".avi", ".webm", ".mkv"]
    },
    "upload": {
        "max_file_size_mb": 500
    },
    "branding": {
        "site_name": "MediaServer",
        "site_name_accent": "Local",
        "footer_message": "",
        "font_family": "system-ui, -apple-system, sans-serif",
        "heading_font_family": ""
    },
    "appearance": {
        "default_theme": "system"
    }
}
```

### Server Settings

| Setting | Description |
|---------|-------------|
| `server.host` | IP address to bind to (`0.0.0.0` for all interfaces) |
| `server.port` | Port number for the web server |
| `server.debug` | Enable Flask debug mode |

### Path Settings

| Setting | Description |
|---------|-------------|
| `paths.media_folder` | Absolute path to your media files |
| `paths.db_folder` | Database storage location (relative or absolute) |

### Format Settings

| Setting | Description |
|---------|-------------|
| `supported_formats.images` | File extensions recognized as images |
| `supported_formats.videos` | File extensions recognized as videos |
| `upload.max_file_size_mb` | Maximum upload file size in MB |

### Branding Settings

| Setting | Description |
|---------|-------------|
| `branding.site_name` | Main site name displayed in header |
| `branding.site_name_accent` | Accent text after site name (shown in blue) |
| `branding.footer_message` | Custom footer text (leave empty to hide footer) |
| `branding.font_family` | CSS font-family for body text |
| `branding.heading_font_family` | CSS font-family for headings (uses body font if empty) |

### Appearance Settings

| Setting | Description |
|---------|-------------|
| `appearance.default_theme` | Default theme: `"light"`, `"dark"`, or `"system"` (follows OS preference) |

Users can toggle dark mode using the sun/moon button in the header. Their preference is saved in localStorage.

If `config.json` doesn't exist, the server will create one with default values on first run.

## Media Organization

Place your media files in the configured `MEDIA_FOLDER` with this structure:

```
media_folder/
├── TitleName/
│   ├── image1.jpg
│   ├── image2.png
│   └── Subfolder/
│       └── video1.mp4
└── AnotherTitle/
    └── photo.jpg
```

Then click **Scan** in the interface to import new files into the database. The top-level folder names become the "Title" for each media item.

## Usage

### View Modes

Toggle between two ways to browse your library using the buttons in the navigation bar:

- **By Title** - Groups media by their Title field (default, based on folder structure)
- **By Category** - Groups media by their Category field

Click on any folder to view its contents. Use the breadcrumb navigation to go back.

### Bulk Editing

To update tags or categories for multiple items at once:

1. Click the **Select** button in the header to enter selection mode
2. Click on images or videos to select them (selected items show a blue checkmark and border)
3. Use the toolbar that appears at the bottom:
   - **Select All** - Select all visible items on the current page
   - **Clear** - Deselect all items
   - **Edit Tags & Category** - Open the bulk edit dialog
4. In the bulk edit dialog:
   - **Category** - Enter a new category to apply to all selected items (leave empty to keep existing)
   - **Tags** - Enter tags separated by commas
   - **Tag Mode**:
     - *Add to existing* - New tags are merged with each item's existing tags
     - *Replace all* - All existing tags are replaced with the new tags
5. Click **Apply to All** to save changes
6. Click **Select** again or **Cancel** to exit selection mode

## Supported Formats

- **Images:** jpg, jpeg, png, gif, webp
- **Videos:** mp4, mov, avi, webm, mkv

## Tech Stack

- **Backend:** Python Flask
- **Frontend:** React 18 (via CDN with in-browser Babel)
- **Styling:** Tailwind CSS
- **Database:** JSON files (per-title, stored in `assets/db/`)

## License

MIT
