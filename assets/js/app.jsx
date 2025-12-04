        const { useState, useEffect, useMemo } = React;

        // --- Mock Data ---
        const MOCK_DATA = [
            { id: 1, type: 'image', path: '/media_content/Mathew Sturdevant/2024/camera.jpg', creator: 'Mathew Sturdevant', category: 'Photography', tags: ['camera', '_cover'], original_name: 'camera.jpg', custom_title: 'Vintage Camera', hidden: false },
            { id: 2, type: 'image', path: '/media_content/Brandi Sturdevant/group.jpg', creator: 'Brandi Sturdevant', category: 'Family', tags: ['friends'], original_name: 'group.jpg', custom_title: '', hidden: false },
        ];

        // --- Icon Component (Fixes React/DOM Conflict) ---
        const Icon = ({ name, className }) => {
            const [svgHtml, setSvgHtml] = useState('');

            useEffect(() => {
                if (window.lucide && window.lucide.icons) {
                    // Convert kebab-case (folder-open) to PascalCase (FolderOpen)
                    const pascalName = name.replace(/(^\w|-\w)/g, (g) => g.replace('-', '').toUpperCase());
                    const iconNode = window.lucide.icons[pascalName];
                    if (iconNode) {
                        setSvgHtml(iconNode.toSvg({ class: className }));
                    }
                }
            }, [name, className]);

            // display: contents ensures the wrapper span doesn't mess up flex layouts
            return <span dangerouslySetInnerHTML={{ __html: svgHtml }} style={{ display: 'contents' }} />;
        };

        const Toast = ({ message, type, onClose }) => {
            useEffect(() => {
                const timer = setTimeout(onClose, 3000);
                return () => clearTimeout(timer);
            }, [onClose]);
            const bgClass = type === 'error' ? 'bg-red-600' : 'bg-green-600';
            return (
                <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 toast-enter`}>
                    <div className={`${bgClass} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3`}>
                        <Icon name={type === 'error' ? 'alert-circle' : 'check-circle'} className="w-5 h-5" />
                        <span className="font-medium">{message}</span>
                    </div>
                </div>
            );
        };

        // --- Components ---

        const Breadcrumbs = ({ path, onNavigate }) => {
            return (
                <div className="flex items-center gap-2 text-lg font-medium text-gray-600 overflow-x-auto whitespace-nowrap pb-2">
                    <button 
                        onClick={() => onNavigate([])}
                        className={`flex items-center gap-1 hover:text-blue-600 ${path.length === 0 ? 'text-gray-900 font-bold' : ''}`}
                    >
                        <Icon name="library" className="w-5 h-5" />
                        Library
                    </button>
                    {path.map((segment, index) => (
                        <React.Fragment key={index}>
                            <Icon name="chevron-right" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <button 
                                onClick={() => onNavigate(path.slice(0, index + 1))}
                                className={`hover:text-blue-600 ${index === path.length - 1 ? 'text-gray-900 font-bold' : ''}`}
                            >
                                {segment}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            );
        };

        const FolderCard = ({ name, items, onClick, onRename }) => {
            // SAFE NAVIGATION FIX: Ensure tags exist before checking includes
            const coverItem = items.find(i => i.hidden && (i.tags || []).includes('_cover')) || 
                              items.find(i => (i.tags || []).includes('_cover')) || 
                              items.find(i => i.type === 'image') || items[0];
            
            const visibleCount = items.filter(i => !i.hidden).length;

            return (
                <div 
                    onClick={onClick}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer flex flex-col h-full relative"
                >
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                        {coverItem ? (
                            coverItem.type === 'image' ? (
                                <img src={coverItem.path} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                                    <Icon name="play-circle" className="w-12 h-12 opacity-50" />
                                </div>
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                <Icon name="folder" className="w-16 h-16" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                        
                        <div className="absolute center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-colors">
                             <Icon name="folder" className="w-16 h-16" />
                        </div>

                        {onRename && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRename(name); }}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-blue-50 text-gray-600 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                title="Rename Collection"
                            >
                                <Icon name="pencil" className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-900 truncate mb-1">{name}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{visibleCount} items</span>
                            <div className="flex items-center gap-1 text-blue-600">
                                <span>Open</span>
                                <Icon name="arrow-right" className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        const FileCard = ({ item, onClick, onEdit, onSetCover }) => {
            // SAFE NAVIGATION FIX: Default tags to empty array
            const tags = item.tags || [];
            
            return (
                <div 
                    onClick={onClick}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 flex flex-col relative cursor-pointer"
                >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {item.type === 'video' ? (
                            <div className="w-full h-full relative">
                                <video 
                                    src={item.path} 
                                    className="w-full h-full object-cover opacity-80" 
                                    preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-white/30 backdrop-blur-sm p-3 rounded-full">
                                        <Icon name="play" className="w-6 h-6 text-white fill-current" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <img 
                                src={item.path} 
                                alt={item.original_name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                loading="lazy" 
                            />
                        )}
                        
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {item.type === 'image' && (
                                <button 
                                    onClick={(e) => onSetCover(item, e)} 
                                    className={`p-1.5 rounded-full shadow-sm ${tags.includes('_cover') ? 'bg-yellow-400 text-white' : 'bg-white/90 text-gray-600 hover:text-yellow-500 hover:bg-white'}`}
                                    title="Set as Folder Cover"
                                >
                                    <Icon name="star" className={`w-4 h-4 ${tags.includes('_cover') ? 'fill-current' : ''}`} />
                                </button>
                            )}
                            <button 
                                onClick={(e) => onEdit(item, e)} 
                                className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-blue-50 text-gray-600 hover:text-blue-600" 
                                title="Edit Details"
                            >
                                <Icon name="edit-2" className="w-4 h-4" />
                            </button>
                        </div>

                        {tags.includes('_cover') && (
                            <div className="absolute top-2 left-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                                COVER
                            </div>
                        )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-medium text-gray-900 truncate mb-1" title={item.custom_title || item.original_name}>{item.custom_title || item.original_name}</h3>
                        <div className="mt-auto flex flex-wrap gap-1">
                            {tags.filter(t => t !== '_cover').slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            );
        };

        const App = () => {
            const [media, setMedia] = useState([]);
            const [loading, setLoading] = useState(true);
            const [serverActive, setServerActive] = useState(false);
            
            // --- Navigation State ---
            const [currentPath, setCurrentPath] = useState([]); 

            // Search & Filter State
            const [searchInput, setSearchInput] = useState('');
            const [searchQuery, setSearchQuery] = useState('');
            const [selectedCategory, setSelectedCategory] = useState('All');

            // Pagination State
            const [visibleCount, setVisibleCount] = useState(48); 

            // Modals
            const [isUploadOpen, setIsUploadOpen] = useState(false);
            const [isEditOpen, setIsEditOpen] = useState(false);
            const [isRenameOpen, setIsRenameOpen] = useState(false);
            const [viewMedia, setViewMedia] = useState(null); 
            
            // UI States
            const [scanning, setScanning] = useState(false);
            const [processing, setProcessing] = useState(false);
            const [toast, setToast] = useState(null); 

            // Forms
            const [uploadForm, setUploadForm] = useState({
                file: null, creator: 'Mathew Sturdevant', category: 'General', tags: '', is_hidden: false
            });
            const [editForm, setEditForm] = useState({
                id: null, custom_title: '', tags: ''
            });
            const [renameForm, setRenameForm] = useState({
                oldName: '', newName: ''
            });

            const showToast = (message, type = 'success') => {
                setToast({ message, type });
            };

            const fetchMedia = async () => {
                try {
                    const res = await fetch('/api/media');
                    if (!res.ok) throw new Error("Server not reachable");
                    const data = await res.json();
                    setMedia(data);
                    setServerActive(true);
                } catch (err) {
                    console.log("Running in preview mode");
                    setMedia(MOCK_DATA);
                    setServerActive(false);
                } finally {
                    setLoading(false);
                }
            };

            useEffect(() => {
                fetchMedia();
            }, []);

            // REMOVED lucide.createIcons() effect to prevent React crashes

            // --- Categories ---
            const categories = ['All', ...new Set(media.map(m => m.category))];
            const creators = ['All', ...new Set(media.map(m => m.creator))];


            // --- Core Content Logic (Directory vs Search) ---
            const viewContent = useMemo(() => {
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const items = media.filter(item => {
                        if (item.hidden) return false;
                        const displayTitle = item.custom_title || item.original_name;
                        // SAFE NAVIGATION FIX: Ensure properties exist before string methods
                        const matchesText = 
                            displayTitle.toLowerCase().includes(q) ||
                            (item.tags || []).some(t => t.toLowerCase().includes(q)) ||
                            (item.creator || '').toLowerCase().includes(q);
                        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
                        return matchesText && matchesCategory;
                    });
                    return { mode: 'search', folders: [], files: items };
                }

                const currentFolders = {};
                const currentFiles = [];

                media.forEach(item => {
                    if (selectedCategory !== 'All' && item.category !== selectedCategory) return;
                    if (!item.path) return; // Guard against bad data
                    
                    const pathParts = item.path.split('/').slice(2); 
                    if (pathParts.length <= currentPath.length) return; 
                    
                    let match = true;
                    for(let i=0; i<currentPath.length; i++) {
                        if (pathParts[i] !== currentPath[i]) { match = false; break; }
                    }
                    if (!match) return;

                    const remainingParts = pathParts.slice(currentPath.length);
                    
                    if (remainingParts.length === 1) {
                        if (!item.hidden) {
                             currentFiles.push(item);
                        }
                    } else {
                        const folderName = remainingParts[0];
                        if (!currentFolders[folderName]) {
                            currentFolders[folderName] = { name: folderName, items: [] };
                        }
                        currentFolders[folderName].items.push(item);
                    }
                });

                return { 
                    mode: 'browse', 
                    folders: Object.values(currentFolders), 
                    files: currentFiles 
                };

            }, [media, currentPath, searchQuery, selectedCategory]);


            // Slice data for pagination
            const visibleFiles = useMemo(() => {
                return viewContent.files.slice(0, visibleCount);
            }, [viewContent, visibleCount]);


            // --- Handlers ---
            const handleSearch = () => { setSearchQuery(searchInput); setVisibleCount(48); };
            const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };
            const navigateToFolder = (folderName) => { setCurrentPath([...currentPath, folderName]); setVisibleCount(48); setSearchQuery(''); setSearchInput(''); };
            const navigateUp = (newPath) => { setCurrentPath(newPath); setVisibleCount(48); setSearchQuery(''); setSearchInput(''); };
            
            const handleScan = async () => {
                if(!serverActive) return showToast("Server not active", 'error');
                setScanning(true);
                try {
                    const res = await fetch('/api/scan', { method: 'POST' });
                    const data = await res.json();
                    showToast(data.message, 'success');
                    fetchMedia();
                } catch(e) {
                    showToast("Scan failed", 'error');
                } finally {
                    setScanning(false);
                }
            };
            
            const handleLoadMore = () => { setVisibleCount(prev => prev + 48); };

            const handleSetCover = async (item, e) => {
                e.stopPropagation();
                if (!serverActive) return showToast("Server offline", 'error');
                setProcessing(true);
                // SAFE NAVIGATION: Ensure tags exist
                const oldCover = media.find(m => m.creator === item.creator && (m.tags || []).includes('_cover'));

                try {
                    if (oldCover && oldCover.id !== item.id) {
                        const newTags = (oldCover.tags || []).filter(t => t !== '_cover');
                        await fetch(`/api/update/${oldCover.id}`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ tags: newTags })
                        });
                    }
                    if (!(item.tags || []).includes('_cover')) {
                        const newTags = [...(item.tags || []), '_cover'];
                        await fetch(`/api/update/${item.id}`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ tags: newTags })
                        });
                        showToast("Cover updated");
                        fetchMedia();
                    } else {
                         showToast("Already the cover");
                    }
                } catch (err) {
                    showToast("Failed to set cover", 'error');
                } finally {
                    setProcessing(false);
                }
            };

            const openRenameModal = (name) => { setRenameForm({ oldName: name, newName: name }); setIsRenameOpen(true); };

            const handleRenameSubmit = async (e) => {
                e.preventDefault();
                setProcessing(true);
                const { oldName, newName } = renameForm;
                if (!newName || newName === oldName) { setProcessing(false); setIsRenameOpen(false); return; }
                const itemsToUpdate = media.filter(item => item.creator === oldName);
                
                // Batch Update
                const updates = itemsToUpdate.map(item => ({ id: item.id, creator: newName }));

                try {
                    const res = await fetch('/api/batch_update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ updates })
                    });
                    if (res.ok) {
                        showToast(`Renamed collection to "${newName}"`);
                        setIsRenameOpen(false);
                        fetchMedia();
                    } else throw new Error();
                } catch (err) {
                    showToast("Error renaming collection", 'error');
                } finally {
                    setProcessing(false);
                }
            };

            const handleUploadChange = (e) => {
                const { name, value, files, type, checked } = e.target;
                setUploadForm(prev => ({ 
                    ...prev, 
                    [name]: type === 'file' ? files[0] : type === 'checkbox' ? checked : value 
                }));
            };

            const handleUploadSubmit = async (e) => {
                e.preventDefault();
                setProcessing(true);
                const formData = new FormData();
                formData.append('file', uploadForm.file);
                formData.append('creator', uploadForm.creator);
                formData.append('category', uploadForm.category);
                formData.append('tags', uploadForm.tags);
                formData.append('is_hidden', uploadForm.is_hidden);

                try {
                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    if (res.ok) {
                        setIsUploadOpen(false);
                        setUploadForm({ file: null, creator: 'Mathew Sturdevant', category: 'General', tags: '', is_hidden: false });
                        showToast("File uploaded successfully");
                        fetchMedia();
                    } else showToast("Upload failed", 'error');
                } catch (error) { showToast("Error uploading", 'error'); } 
                finally { setProcessing(false); }
            };

            const openEditModal = (item, e) => {
                if(e) e.stopPropagation(); 
                setEditForm({ id: item.id, custom_title: item.custom_title || '', tags: (item.tags || []).filter(t => t !== '_cover').join(', ') });
                setIsEditOpen(true);
            };

            const handleEditSubmit = async (e) => {
                e.preventDefault();
                setProcessing(true);
                const originalItem = media.find(m => m.id === editForm.id);
                const isCover = (originalItem?.tags || []).includes('_cover');
                let tagList = editForm.tags.split(',').map(t => t.trim()).filter(Boolean);
                if (isCover) tagList.push('_cover');
                try {
                    const res = await fetch(`/api/update/${editForm.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, tags: tagList }) });
                    if (res.ok) { setIsEditOpen(false); showToast("Details updated"); fetchMedia(); } else showToast("Update failed", 'error');
                } catch (error) { showToast("Error updating", 'error'); } finally { setProcessing(false); }
            };

            return (
                <div className="min-h-screen flex flex-col relative pb-20">
                    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                    {scanning && (
                        <div className="fixed bottom-6 right-6 z-40 scan-overlay">
                            <div className="bg-blue-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-4">
                                <Icon name="loader-2" className="animate-spin w-6 h-6" />
                                <div><h4 className="font-semibold">Scanning Library...</h4><p className="text-xs text-blue-100">This may take a moment</p></div>
                            </div>
                        </div>
                    )}
                    {viewMedia && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setViewMedia(null)}>
                            <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-50"><Icon name="x" className="w-8 h-8" /></button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-white z-40" onClick={e => e.stopPropagation()}>
                                <h2 className="text-2xl font-bold">{viewMedia.custom_title || viewMedia.original_name}</h2>
                                <div className="flex items-center gap-4 mt-2 text-white/80">
                                    <span className="flex items-center gap-1"><Icon name="user" className="w-4 h-4" /> {viewMedia.creator}</span>
                                    <span className="flex items-center gap-1"><Icon name="folder" className="w-4 h-4" /> {viewMedia.category}</span>
                                    {(viewMedia.tags || []).length > 0 && (
                                        <div className="flex gap-2">{(viewMedia.tags || []).filter(t => t !== '_cover').map((t,i) => <span key={i} className="bg-white/20 px-2 py-0.5 rounded text-sm">#{t}</span>)}</div>
                                    )}
                                </div>
                            </div>
                            <div className="w-full h-full flex items-center justify-center p-4 lightbox-enter" onClick={e => e.stopPropagation()}>
                                {viewMedia.type === 'image' ? (
                                    <img src={viewMedia.path} alt={viewMedia.original_name} className="max-h-full max-w-full object-contain rounded shadow-2xl" />
                                ) : (
                                    <video src={viewMedia.path} className="max-h-full max-w-full rounded shadow-2xl" controls autoPlay preload="auto" />
                                )}
                            </div>
                        </div>
                    )}
                    <header className="bg-white shadow-sm sticky top-0 z-10">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateUp([])}>
                                <Icon name="hard-drive" className="text-blue-600" />
                                <h1 className="text-xl font-bold text-gray-900 hidden sm:block">MediaServer<span className="text-blue-600">Local</span></h1>
                            </div>
                            <div className="flex-1 max-w-lg relative flex items-center gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-2.5 text-gray-400"><Icon name="search" className="w-5 h-5" /></span>
                                    <input type="text" placeholder="Search files..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleKeyDown}/>
                                </div>
                                <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors" title="Search"><Icon name="arrow-right" className="w-5 h-5" /></button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleScan} disabled={scanning} className={`bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${scanning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Icon name="refresh-cw" className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                                    <span className="hidden md:inline">{scanning ? 'Scanning...' : 'Scan'}</span>
                                </button>
                                <button onClick={() => setIsUploadOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                                    <Icon name="upload-cloud" className="w-4 h-4" />
                                    <span className="hidden md:inline">Upload</span>
                                </button>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        {!serverActive && (
                            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm">
                                <p className="text-sm text-yellow-700">Preview Mode: Python server not detected.</p>
                            </div>
                        )}
                        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {searchQuery ? (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => {setSearchQuery(''); setSearchInput('');}} className="text-blue-600 hover:underline flex items-center gap-1"><Icon name="arrow-left" className="w-4 h-4" /> Back</button>
                                        <h2 className="text-xl font-bold text-gray-800">Search: "{searchQuery}"</h2>
                                    </div>
                                ) : (
                                    <Breadcrumbs path={currentPath} onNavigate={navigateUp} />
                                )}
                            </div>
                            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white outline-none min-w-[150px]" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option value="All">All Categories</option>
                                {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                        ) : (
                            <>
                                {viewContent.folders.length === 0 && viewContent.files.length === 0 && (
                                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                        <Icon name="folder-open" className="mx-auto w-12 h-12 text-gray-300 mb-2" />
                                        <h3 className="text-sm font-medium text-gray-900">{searchQuery ? "No matches found" : "Empty Folder"}</h3>
                                        <p className="text-gray-500 text-sm mt-1">{searchQuery ? "Try a different term" : "No media found in this location"}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {viewContent.folders.map(folder => (
                                        <FolderCard key={folder.name} name={folder.name} items={folder.items} onClick={() => navigateToFolder(folder.name)} onRename={currentPath.length === 0 ? openRenameModal : null} />
                                    ))}
                                    {visibleFiles.map(item => (
                                        <FileCard key={item.id} item={item} onClick={() => setViewMedia(item)} onEdit={openEditModal} onSetCover={handleSetCover} />
                                    ))}
                                </div>
                                {viewContent.files.length > visibleCount && (
                                    <div className="mt-8 flex justify-center">
                                        <button onClick={handleLoadMore} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-50 shadow-sm transition-all">
                                            Load More ({viewContent.files.length - visibleFiles.length} remaining)
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                    {isRenameOpen && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen px-4">
                                <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setIsRenameOpen(false)}></div>
                                <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 p-6">
                                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-medium">Rename Collection</h3><button onClick={() => setIsRenameOpen(false)}><Icon name="x" className="w-5 h-5 text-gray-400" /></button></div>
                                    <p className="text-sm text-gray-500 mb-4">This will update the Creator name for all {media.filter(i => i.creator === renameForm.oldName).length} items in this group.</p>
                                    <form onSubmit={handleRenameSubmit}>
                                        <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">New Name</label><input type="text" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border" value={renameForm.newName} onChange={(e) => setRenameForm({...renameForm, newName: e.target.value})} autoFocus /></div>
                                        <div className="flex justify-end gap-3"><button type="button" onClick={() => setIsRenameOpen(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button><button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{processing ? 'Renaming...' : 'Save Changes'}</button></div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                    {isEditOpen && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen px-4">
                                <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setIsEditOpen(false)}></div>
                                <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 p-6">
                                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-medium">Edit Media</h3><button onClick={() => setIsEditOpen(false)}><Icon name="x" className="w-5 h-5 text-gray-400" /></button></div>
                                    <form onSubmit={handleEditSubmit}>
                                        <div className="space-y-4">
                                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" className="w-full border p-2 rounded" value={editForm.custom_title} onChange={(e) => setEditForm({...editForm, custom_title: e.target.value})} /></div>
                                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tags</label><input type="text" className="w-full border p-2 rounded" value={editForm.tags} onChange={(e) => setEditForm({...editForm, tags: e.target.value})} /></div>
                                        </div>
                                        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button></div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                    {isUploadOpen && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen px-4">
                                <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setIsUploadOpen(false)}></div>
                                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg z-10 p-6">
                                    <h3 className="text-lg font-medium mb-4">Upload Media</h3>
                                    <form onSubmit={handleUploadSubmit}>
                                        <div className="space-y-4">
                                            <input type="file" name="file" onChange={handleUploadChange} required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                            <input type="text" name="creator" list="creators-list" placeholder="Creator" required className="w-full border p-2 rounded" value={uploadForm.creator} onChange={handleUploadChange}/>
                                            <datalist id="creators-list"><option value="Mathew Sturdevant" /><option value="Brandi Sturdevant" /></datalist>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" name="category" placeholder="Category" required className="w-full border p-2 rounded" value={uploadForm.category} onChange={handleUploadChange}/>
                                                <input type="text" name="tags" placeholder="Tags..." className="w-full border p-2 rounded" value={uploadForm.tags} onChange={handleUploadChange}/>
                                            </div>
                                            <div className="flex items-center">
                                                <input type="checkbox" name="is_hidden" id="is_hidden" checked={uploadForm.is_hidden} onChange={handleUploadChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                                <label htmlFor="is_hidden" className="ml-2 block text-sm text-gray-900">Use as Hidden Collection Cover</label>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-end gap-3">
                                            <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                                            <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{processing ? 'Uploading...' : 'Save'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);