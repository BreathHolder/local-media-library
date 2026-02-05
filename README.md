# Local Media Hub

A self-hosted media library for browsing and managing your local images and videos. Features a clean, modern interface with folder navigation, search, tagging, and a lightbox viewer.

## Features

- **Folder-based navigation** - Browse media organized by creator and subfolders
- **Search** - Find files by title, tags, or creator name
- **Category filtering** - Filter content by category
- **Lightbox viewer** - Full-screen media viewing with video playback
- **Media management** - Edit titles, tags, and categories
- **Cover images** - Set custom cover images for folders
- **File upload** - Add new media directly through the interface
- **Library scanning** - Automatically discover new files in your media directory
- **Preview mode** - Frontend works standalone with mock data when server is unavailable

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

3. Configure your media folder path in `assets/py/media_server.py`:
   ```python
   MEDIA_FOLDER = '/path/to/your/media/folder'
   ```

4. Start the server:
   ```bash
   python assets/py/media_server.py
   ```

5. Open http://127.0.0.1:5000 in your browser

## Media Organization

Place your media files in the configured `MEDIA_FOLDER` with this structure:

```
media_folder/
├── CreatorName/
│   ├── image1.jpg
│   ├── image2.png
│   └── Subfolder/
│       └── video1.mp4
└── AnotherCreator/
    └── photo.jpg
```

Then click **Scan** in the interface to import new files into the database.

## Supported Formats

- **Images:** jpg, jpeg, png, gif, webp
- **Videos:** mp4, mov, avi, webm, mkv

## Tech Stack

- **Backend:** Python Flask
- **Frontend:** React 18 (via CDN with in-browser Babel)
- **Styling:** Tailwind CSS
- **Database:** JSON files (per-creator, stored in `assets/db/`)

## License

MIT
