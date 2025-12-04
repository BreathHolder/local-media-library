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

# New Database Directory: ./assets/db/
DB_FOLDER = os.path.join(PROJECT_ROOT, 'assets', 'db')
LEGACY_DATA_FILE = os.path.join(PROJECT_ROOT, 'media_db.json')
INDEX_FILE = os.path.join(PROJECT_ROOT, 'index.html')
# We still allow reading media from the external drive
MEDIA_FOLDER = '/mnt/d/Media/Private/categories'

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
    """Splits the giant media_db.json into per-creator files if it exists."""
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

            # Group by creator
            grouped_data = {}
            for item in data:
                creator = item.get('creator', 'Uncategorized')
                if creator not in grouped_data:
                    grouped_data[creator] = []
                grouped_data[creator].append(item)

            # Write individual files
            for creator, items in grouped_data.items():
                safe_name = secure_filename(creator) or 'Uncategorized'
                file_path = os.path.join(DB_FOLDER, f"{safe_name}.json")
                with open(file_path, 'w') as f:
                    json.dump(items, f, indent=4)
            
            print(f"Migration complete. Split into {len(grouped_data)} files.")
            
            # Rename legacy file to backup so we don't migrate again
            os.rename(LEGACY_DATA_FILE, LEGACY_DATA_FILE + ".bak")
            print(f"Renamed legacy file to {LEGACY_DATA_FILE}.bak")

        except Exception as e:
            print(f"Error during migration: {e}")

# Run setup
ensure_directories()
migrate_legacy_db()

# --- Database Helpers ---

def get_creator_filename(creator):
    """Returns the JSON filename for a specific creator."""
    safe_name = secure_filename(creator) or 'Uncategorized'
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

def save_creator_data(creator, data):
    """Saves a list of media items to a specific creator's file."""
    filepath = get_creator_filename(creator)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

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
    """Scans directory and adds new files to correct creator DBs."""
    try:
        existing_items = load_all_media()
        existing_paths = {item['path'] for item in existing_items}
        
        # We need to buffer new items by creator to minimize writes
        new_items_by_creator = {}
        
        IMG_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        VID_EXTS = {'.mp4', '.mov', '.avi', '.webm', '.mkv'}

        print(f"Scanning: {MEDIA_FOLDER}")

        for root, dirs, files in os.walk(MEDIA_FOLDER):
            for file in files:
                file_ext = os.path.splitext(file)[1].lower()
                if file_ext in IMG_EXTS or file_ext in VID_EXTS:
                    rel_path = os.path.relpath(root, MEDIA_FOLDER)
                    rel_path_web = rel_path.replace('\\', '/')
                    
                    if rel_path == '.':
                        creator = "Uncategorized"
                        web_path = f"/media_content/{file}"
                    else:
                        creator = rel_path.split(os.sep)[0]
                        web_path = f"/media_content/{rel_path_web}/{file}"
                    
                    if web_path not in existing_paths:
                        if creator not in new_items_by_creator:
                            new_items_by_creator[creator] = []

                        media_type = 'image' if file_ext in IMG_EXTS else 'video'
                        new_entry = {
                            'id': str(uuid.uuid4()),
                            'filename': file,
                            'original_name': file,
                            'custom_title': "", 
                            'creator': creator,
                            'category': 'Imported',
                            'tags': [],
                            'hidden': False,
                            'type': media_type,
                            'path': web_path,
                            'real_path': os.path.join(root, file)
                        }
                        new_items_by_creator[creator].append(new_entry)
                        existing_paths.add(web_path) # Prevent duplicates in same scan run

        # Save updates
        total_added = 0
        for creator, new_items in new_items_by_creator.items():
            filepath = get_creator_filename(creator)
            current_data = []
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    current_data = json.load(f)
            
            current_data.extend(new_items)
            save_creator_data(creator, current_data)
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
    creator = request.form.get('creator', 'Unknown')
    category = request.form.get('category', 'Uncategorized')
    tags = request.form.get('tags', '')
    is_hidden = request.form.get('is_hidden') == 'true'
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        filename = secure_filename(file.filename)
        file_ext = os.path.splitext(filename)[1].lower()
        media_type = 'image' if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp'] else 'video'
        if file_ext in ['.mp4', '.mov', '.avi', '.webm']: media_type = 'video'

        creator_safe = secure_filename(creator)
        # Save physically
        save_path = os.path.join(MEDIA_FOLDER, creator_safe)
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
            'creator': creator,
            'category': category,
            'tags': tags_list,
            'hidden': is_hidden,
            'type': media_type,
            'path': f"/media_content/{creator_safe}/{final_filename}"
        }

        # Load ONLY specific creator file
        filepath = get_creator_filename(creator)
        data = []
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data = json.load(f)
        
        data.append(new_entry)
        save_creator_data(creator, data)

        return jsonify(new_entry), 201

@app.route('/api/update/<media_id>', methods=['POST'])
def update_media(media_id):
    """Updates an item. Scans files to find it. Handles creator moves."""
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
                new_creator = data.get('creator')
                old_creator = item['creator']
                
                if new_creator and new_creator != old_creator:
                    # Remove from this list
                    item = items.pop(item_index)
                    # Update fields
                    item.update({k: v for k, v in data.items() if k in item})
                    # Save current file (deletion)
                    save_creator_data(old_creator, items)
                    
                    # Add to new file
                    new_filepath = get_creator_filename(new_creator)
                    new_items = []
                    if os.path.exists(new_filepath):
                        with open(new_filepath, 'r') as nf:
                            new_items = json.load(nf)
                    new_items.append(item)
                    save_creator_data(new_creator, new_items)
                    
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
                            
                    save_creator_data(old_creator, items)
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
    modified_creators = set()
    
    # We essentially need to do a pass over the DB.
    # Since batch updates (renaming collection) usually happens within one creator,
    # we can optimize. But let's be safe and scan.
    
    # Optimization: If all updates have the same 'creator' change, 
    # we are likely moving a whole file content to another.
    
    # Simplified generic approach:
    for filename in os.listdir(DB_FOLDER):
        if not filename.endswith('.json'): continue
        filepath = os.path.join(DB_FOLDER, filename)
        
        try:
            with open(filepath, 'r') as f:
                items = json.load(f)
            
            file_modified = False
            items_to_move = [] # (new_creator, item)
            
            # Iterate backwards to allow safe removal
            for i in range(len(items) - 1, -1, -1):
                item = items[i]
                if item['id'] in updates_by_id:
                    change = updates_by_id[item['id']]
                    
                    # Handle Creator Change (Move)
                    if 'creator' in change and change['creator'] != item['creator']:
                        item['creator'] = change['creator'] # Update object
                        items_to_move.append((change['creator'], item))
                        items.pop(i) # Remove from current
                        file_modified = True
                    else:
                        # In-place update
                        item.update({k: v for k, v in change.items() if k in item})
                        file_modified = True
            
            # Save if modified (items removed or updated in place)
            if file_modified:
                # Determine original creator from filename is risky if sanitization collides
                # But mostly fine. Better: rely on `save_creator_data` logic
                # We can overwrite the file we just read.
                with open(filepath, 'w') as f:
                    json.dump(items, f, indent=4)
            
            # Handle Moves
            for new_creator, item in items_to_move:
                # This is inefficient if moving 1000 items (opens file 1000 times)
                # But acceptable for now or needs buffering.
                # BUFFERING LOGIC:
                tgt_path = get_creator_filename(new_creator)
                tgt_data = []
                if os.path.exists(tgt_path):
                    with open(tgt_path, 'r') as tf:
                        tgt_data = json.load(tf)
                tgt_data.append(item)
                save_creator_data(new_creator, tgt_data)

        except Exception as e:
            print(f"Batch error in {filename}: {e}")

    return jsonify({'message': 'Batch update complete'})

@app.route('/media_content/<path:subpath>')
def serve_media(subpath):
    return send_from_directory(MEDIA_FOLDER, subpath)

@app.route('/api/creators', methods=['GET'])
def get_creators():
    # Listing creators is now just listing filenames roughly
    # But better to load DB to be accurate
    data = load_all_media()
    creators = list(set(item['creator'] for item in data))
    return jsonify(creators)

if __name__ == '__main__':
    print("-------------------------------------------------------")
    print(f"Server running at: http://127.0.0.1:5000")
    print(f"Database folder: {DB_FOLDER}")
    print("-------------------------------------------------------")
    app.run(debug=True, port=5000)