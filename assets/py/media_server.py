import os
import json
import uuid
import shutil
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from werkzeug.utils import secure_filename

app = Flask(__name__)

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '../../'))
ASSETS_FOLDER = os.path.join(PROJECT_ROOT, 'assets')
CONFIG_FILE = os.path.join(PROJECT_ROOT, 'config.json')

# Load configuration from config.json
def load_config():
    """Load configuration from config.json with fallback defaults."""
    default_config = {
        "server": {
            "host": "127.0.0.1",
            "port": 5000,
            "debug": True
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
        },
        "integrity": {
            "auto_fix_title_creator": False
        }
    }

    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                user_config = json.load(f)
                # Merge user config with defaults (user config takes precedence)
                for key in default_config:
                    if key in user_config:
                        if isinstance(default_config[key], dict):
                            default_config[key].update(user_config[key])
                        else:
                            default_config[key] = user_config[key]
                return default_config
        except Exception as e:
            print(f"Error loading config.json: {e}. Using defaults.")
    else:
        # Create default config file if it doesn't exist
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump(default_config, f, indent=4)
            print(f"Created default config file at {CONFIG_FILE}")
        except Exception as e:
            print(f"Could not create config file: {e}")

    return default_config

CONFIG = load_config()

# Apply configuration
db_folder_path = CONFIG['paths']['db_folder']
if not os.path.isabs(db_folder_path):
    DB_FOLDER = os.path.join(PROJECT_ROOT, db_folder_path)
else:
    DB_FOLDER = db_folder_path

LEGACY_DATA_FILE = os.path.join(PROJECT_ROOT, 'media_db.json')
INDEX_FILE = os.path.join(PROJECT_ROOT, 'index.html')
MEDIA_FOLDER = CONFIG['paths']['media_folder']

# Supported file extensions from config
IMG_EXTS = set(CONFIG['supported_formats']['images'])
VID_EXTS = set(CONFIG['supported_formats']['videos'])

# --- Common Helpers ---

def get_item_title(item):
    """Returns a title using title/creator interchangeably with fallbacks."""
    return item.get('title') or item.get('creator') or item.get('category') or 'Uncategorized'

def set_item_title(item, title):
    """Keeps title and creator in sync."""
    if not title:
        return
    item['title'] = title
    item['creator'] = title

# --- Initialization & Migration ---

def ensure_directories():
    if not os.path.exists(DB_FOLDER):
        os.makedirs(DB_FOLDER)
    if not os.path.exists(MEDIA_FOLDER):
        try:
            os.makedirs(MEDIA_FOLDER)
        except OSError:
            pass

def migrate_legacy_db():
    """Splits the giant media_db.json into per-title files if it exists."""
    if os.path.exists(LEGACY_DATA_FILE):
        print(f"Legacy database found at {LEGACY_DATA_FILE}. Starting migration...")
        try:
            with open(LEGACY_DATA_FILE, 'r') as f:
                # Handle empty legacy file
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    print("Legacy DB was empty or corrupt. Skipping migration.")
                    return

            if not data:
                return

            # Group by title
            grouped_data = {}
            for item in data:
                title = get_item_title(item)
                if title not in grouped_data:
                    grouped_data[title] = []
                grouped_data[title].append(item)

            # Write individual files
            for title, items in grouped_data.items():
                safe_name = secure_filename(title) or 'Uncategorized'
                file_path = os.path.join(DB_FOLDER, f"{safe_name}.json")
                with open(file_path, 'w') as f:
                    json.dump(items, f, indent=4)
            
            print(f"Migration complete. Split into {len(grouped_data)} files.")
            
            # Rename legacy file to backup so we don't migrate again
            os.rename(LEGACY_DATA_FILE, LEGACY_DATA_FILE + ".bak")
            print(f"Renamed legacy file to {LEGACY_DATA_FILE}.bak")

        except Exception as e:
            print(f"Error during migration: {e}")

# --- Database Helpers ---

def get_title_filename(title):
    """Returns the JSON filename for a specific title."""
    safe_name = secure_filename(title) or 'Uncategorized'
    return os.path.join(DB_FOLDER, f"{safe_name}.json")

def load_all_media():
    """Aggregates all JSON files in the DB_FOLDER into one list."""
    all_media = []
    if not os.path.exists(DB_FOLDER):
        return []
    
    for filename in os.listdir(DB_FOLDER):
        if filename.endswith('.json'):
            try:
                with open(os.path.join(DB_FOLDER, filename), 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        all_media.extend(data)
            except Exception as e:
                print(f"Error reading {filename}: {e}")
    return all_media

def save_title_data(title, data):
    """Saves a list of media items to a specific title's file."""
    filepath = get_title_filename(title)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

def integrity_check_title_creator(auto_fix=False):
    """Scan DB for missing/mismatched title/creator and optionally fix."""
    if not os.path.exists(DB_FOLDER):
        print("Integrity check skipped: DB folder does not exist.")
        return

    files_scanned = 0
    files_modified = 0
    items_scanned = 0
    items_fixed = 0

    for filename in os.listdir(DB_FOLDER):
        if not filename.endswith('.json'):
            continue
        filepath = os.path.join(DB_FOLDER, filename)
        try:
            with open(filepath, 'r') as f:
                items = json.load(f)
            if not isinstance(items, list):
                continue
        except Exception as e:
            print(f"Integrity check error in {filename}: {e}")
            continue

        files_scanned += 1
        changed = False

        for item in items:
            if not isinstance(item, dict):
                continue
            items_scanned += 1

            title = item.get('title')
            creator = item.get('creator')

            # Determine canonical title using the shared helper
            canonical = get_item_title(item)

            if title != canonical or creator != canonical:
                if auto_fix:
                    set_item_title(item, canonical)
                    items_fixed += 1
                    changed = True
                else:
                    print(f"Integrity warning in {filename}: id={item.get('id')} title={title} creator={creator}")

        if changed:
            with open(filepath, 'w') as f:
                json.dump(items, f, indent=4)
            files_modified += 1

    print("Integrity check summary:")
    print(f"  files_scanned={files_scanned}")
    print(f"  files_modified={files_modified}")
    print(f"  items_scanned={items_scanned}")
    print(f"  items_fixed={items_fixed}")

# Run setup
ensure_directories()
migrate_legacy_db()
integrity_check_title_creator(CONFIG.get('integrity', {}).get('auto_fix_title_creator', False))

# --- Routes ---

@app.route('/')
def index():
    try:
        with open(INDEX_FILE, 'r') as f:
            return render_template_string(f.read())
    except FileNotFoundError:
        return f"Error: index.html not found at {INDEX_FILE}."

@app.route('/api/media', methods=['GET'])
def get_media():
    return jsonify(load_all_media())

@app.route('/api/scan', methods=['POST'])
def scan_media():
    """Scans directory and adds new files to correct title DBs."""
    try:
        existing_items = load_all_media()
        existing_paths = {item['path'] for item in existing_items}
        
        # We need to buffer new items by title to minimize writes
        new_items_by_title = {}

        print(f"Scanning: {MEDIA_FOLDER}")

        for root, dirs, files in os.walk(MEDIA_FOLDER):
            for file in files:
                file_ext = os.path.splitext(file)[1].lower()
                if file_ext in IMG_EXTS or file_ext in VID_EXTS:
                    rel_path = os.path.relpath(root, MEDIA_FOLDER)
                    rel_path_web = rel_path.replace('\\', '/')
                    
                    if rel_path == '.':
                        title = "Uncategorized"
                        web_path = f"/media_content/{file}"
                    else:
                        title = rel_path.split(os.sep)[0]
                        web_path = f"/media_content/{rel_path_web}/{file}"
                    
                    if web_path not in existing_paths:
                        if title not in new_items_by_title:
                            new_items_by_title[title] = []

                        media_type = 'image' if file_ext in IMG_EXTS else 'video'
                        new_entry = {
                            'id': str(uuid.uuid4()),
                            'filename': file,
                            'original_name': file,
                            'custom_title': "", 
                            'title': title,
                            'creator': title,
                            'category': 'Imported',
                            'tags': [],
                            'hidden': False,
                            'type': media_type,
                            'path': web_path,
                            'real_path': os.path.join(root, file)
                        }
                        new_items_by_title[title].append(new_entry)
                        existing_paths.add(web_path) # Prevent duplicates in same scan run

        # Save updates
        total_added = 0
        for title, new_items in new_items_by_title.items():
            filepath = get_title_filename(title)
            current_data = []
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    current_data = json.load(f)
            
            current_data.extend(new_items)
            save_title_data(title, current_data)
            total_added += len(new_items)

        return jsonify({'message': f'Scan complete. Added {total_added} new items.', 'added_count': total_added})
    except Exception as e:
        print(f"Scan error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    title = request.form.get('title', 'Unknown')
    category = request.form.get('category', 'Uncategorized')
    tags = request.form.get('tags', '')
    is_hidden = request.form.get('is_hidden') == 'true'
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        filename = secure_filename(file.filename)
        file_ext = os.path.splitext(filename)[1].lower()
        media_type = 'image' if file_ext in IMG_EXTS else 'video' if file_ext in VID_EXTS else 'image'

        title_safe = secure_filename(title)
        # Save physically
        save_path = os.path.join(MEDIA_FOLDER, title_safe)
        if not os.path.exists(save_path): os.makedirs(save_path)
        
        final_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
        file.save(os.path.join(save_path, final_filename))

        tags_list = [t.strip() for t in tags.split(',') if t.strip()]
        if is_hidden and '_cover' not in tags_list: tags_list.append('_cover')

        new_entry = {
            'id': str(uuid.uuid4()),
            'filename': final_filename,
            'original_name': filename,
            'custom_title': "",
            'title': title,
            'creator': title,
            'category': category,
            'tags': tags_list,
            'hidden': is_hidden,
            'type': media_type,
            'path': f"/media_content/{title_safe}/{final_filename}"
        }

        # Load ONLY specific title file
        filepath = get_title_filename(title)
        data = []
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data = json.load(f)
        
        data.append(new_entry)
        save_title_data(title, data)

        return jsonify(new_entry), 201

@app.route('/api/update/<media_id>', methods=['POST'])
def update_media(media_id):
    """Updates an item. Scans files to find it. Handles title moves."""
    data = request.json
    
    # We iterate all JSON files to find the item
    for filename in os.listdir(DB_FOLDER):
        if not filename.endswith('.json'): continue
        
        filepath = os.path.join(DB_FOLDER, filename)
        try:
            with open(filepath, 'r') as f:
                items = json.load(f)
            
            item_index = next((i for i, item in enumerate(items) if item['id'] == media_id), -1)
            
            if item_index != -1:
                item = items[item_index]
                
                # Check if Creator Changed (requires moving between files)
                new_title = data.get('title') or data.get('creator')
                old_title = get_item_title(item)
                
                if new_title and new_title != old_title:
                    # Remove from this list
                    item = items.pop(item_index)
                    # Update fields
                    item.update({k: v for k, v in data.items() if k in item})
                    set_item_title(item, new_title)
                    # Save current file (deletion)
                    save_title_data(old_title, items)
                    
                    # Add to new file
                    new_filepath = get_title_filename(new_title)
                    new_items = []
                    if os.path.exists(new_filepath):
                        with open(new_filepath, 'r') as nf:
                            new_items = json.load(nf)
                    new_items.append(item)
                    save_title_data(new_title, new_items)
                    
                    return jsonify({'message': 'Updated and moved successfully'})
                
                else:
                    # Simple update in place
                    # Process tags carefully
                    if 'tags' in data:
                        tags_input = data['tags']
                        if isinstance(tags_input, str):
                            item['tags'] = [t.strip() for t in tags_input.split(',') if t.strip()]
                        else:
                            item['tags'] = tags_input
                    
                    # Update other scalar fields
                    for field in ['custom_title', 'hidden', 'category']:
                        if field in data:
                            item[field] = data[field]
                    if 'title' in data or 'creator' in data:
                        set_item_title(item, new_title)
                            
                    save_title_data(old_title, items)
                    return jsonify({'message': 'Updated successfully'})
                    
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            continue

    return jsonify({'error': 'Item not found'}), 404

@app.route('/api/batch_update', methods=['POST'])
def batch_update():
    """Handles renaming collections efficiently by rewriting specific files."""
    data = request.json
    updates = data.get('updates', [])
    if not updates: return jsonify({'message': 'No updates'}), 400

    # Group updates by ID for fast lookup
    updates_by_id = {u['id']: u for u in updates}
    
    # Track which files need saving
    modified_titles = set()
    
    # We essentially need to do a pass over the DB.
    # Since batch updates (renaming collection) usually happens within one title,
    # we can optimize. But let's be safe and scan.
    
    # Optimization: If all updates have the same 'title' change, 
    # we are likely moving a whole file content to another.
    
    # Simplified generic approach:
    for filename in os.listdir(DB_FOLDER):
        if not filename.endswith('.json'): continue
        filepath = os.path.join(DB_FOLDER, filename)
        
        try:
            with open(filepath, 'r') as f:
                items = json.load(f)
            
            file_modified = False
            items_to_move = [] # (new_title, item)
            
            # Iterate backwards to allow safe removal
            for i in range(len(items) - 1, -1, -1):
                item = items[i]
                if item['id'] in updates_by_id:
                    change = updates_by_id[item['id']]
                    
                    # Handle Creator Change (Move)
                    new_title = change.get('title') or change.get('creator')
                    old_title = get_item_title(item)
                    if new_title and new_title != old_title:
                        set_item_title(item, new_title) # Update object
                        items_to_move.append((new_title, item))
                        items.pop(i) # Remove from current
                        file_modified = True
                    else:
                        # In-place update
                        item.update({k: v for k, v in change.items() if k in item})
                        if 'title' in change or 'creator' in change:
                            set_item_title(item, new_title)
                        file_modified = True
            
            # Save if modified (items removed or updated in place)
            if file_modified:
                # Determine original title from filename is risky if sanitization collides
                # But mostly fine. Better: rely on `save_title_data` logic
                # We can overwrite the file we just read.
                with open(filepath, 'w') as f:
                    json.dump(items, f, indent=4)
            
            # Handle Moves
            for new_title, item in items_to_move:
                # This is inefficient if moving 1000 items (opens file 1000 times)
                # But acceptable for now or needs buffering.
                # BUFFERING LOGIC:
                tgt_path = get_title_filename(new_title)
                tgt_data = []
                if os.path.exists(tgt_path):
                    with open(tgt_path, 'r') as tf:
                        tgt_data = json.load(tf)
                tgt_data.append(item)
                save_title_data(new_title, tgt_data)

        except Exception as e:
            print(f"Batch error in {filename}: {e}")

    return jsonify({'message': 'Batch update complete'})

@app.route('/media_content/<path:subpath>')
def serve_media(subpath):
    return send_from_directory(MEDIA_FOLDER, subpath)

@app.route('/api/titles', methods=['GET'])
def get_titles():
    """Returns list of all unique titles."""
    data = load_all_media()
    titles = list(set(get_item_title(item) for item in data if get_item_title(item)))
    return jsonify(sorted(titles))

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Returns list of all unique categories."""
    data = load_all_media()
    categories = list(set(item['category'] for item in data if item.get('category')))
    return jsonify(sorted(categories))

@app.route('/api/config', methods=['GET'])
def get_public_config():
    """Returns branding and other frontend-safe configuration."""
    return jsonify({
        'branding': CONFIG.get('branding', {}),
        'appearance': CONFIG.get('appearance', {}),
        'supported_formats': CONFIG.get('supported_formats', {})
    })

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve CSS, JS, and other static assets from the assets folder."""
    return send_from_directory(ASSETS_FOLDER, filename)


if __name__ == '__main__':
    host = CONFIG['server']['host']
    port = CONFIG['server']['port']
    debug = CONFIG['server']['debug']

    print("-------------------------------------------------------")
    print(f"Server running at: http://{host}:{port}")
    print(f"Media folder: {MEDIA_FOLDER}")
    print(f"Database folder: {DB_FOLDER}")
    print(f"Config file: {CONFIG_FILE}")
    print("-------------------------------------------------------")
    app.run(host=host, debug=debug, port=port)
