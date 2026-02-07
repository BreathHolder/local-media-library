const { useState, useEffect, useMemo, useCallback, useRef } = React;

// --- Mock Data ---
const MOCK_DATA = [
    {
        id: 1,
        type: "image",
        path: "/media_content/breathholder/2024/camera.jpg",
        title: "breathholder",
        category: "Photography",
        tags: ["camera", "_cover"],
        original_name: "camera.jpg",
        custom_title: "Vintage Camera",
        hidden: false,
    },
    {
        id: 2,
        type: "image",
        path: "/media_content/dumdum/group.jpg",
        title: "dumdum",
        category: "Screenshots",
        tags: ["friends"],
        original_name: "game.jpg",
        custom_title: "",
        hidden: false,
    },
];

// --- Icon Component (Lucide via data-lucide) ---
const ICON_MAP = {
    'library': '📚',
    'chevron-left': '‹',
    'chevron-right': '›',
    'folder': '📁',
    'folder-open': '📂',
    'arrow-right': '→',
    'alert-circle': '⚠️',
    'check-circle': '✅',
    'play-circle': '▶️',
    'play': '▶️',
    'star': '★',
    'edit-2': '✏️',
    'loader-2': '⏳',
    'x': '✕',
    'user': '👤',
    'refresh-cw': '⟳',
    'upload-cloud': '☁️↑',
    'search': '🔍',
    'hard-drive': '💾',
    'sun': '☀️',
    'moon': '🌙',
    'check': '✓',
    'select': '☑️',
    'tag': '🏷️',
};

const Icon = ({ name, className = "" }) => (
    <span className={className}>
        {ICON_MAP[name] || '•'}
    </span>
);

const readUiState = () => {
    try {
        const raw = localStorage.getItem("ui_state");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        return parsed;
    } catch (err) {
        return null;
    }
};

const readUrlState = () => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const hasView = params.has("view");
    const hasPath = params.has("path");
    const hasQuery = params.has("q");
    if (!hasView && !hasPath && !hasQuery) return null;

    const viewMode = params.get("view") === "category" ? "category" : "title";
    const pathRaw = params.get("path") || "";
    const currentPath = pathRaw ? pathRaw.split("/").filter(Boolean) : [];
    const searchQuery = params.get("q") || "";
    return {
        viewMode,
        currentPath,
        searchQuery,
        searchInput: searchQuery,
    };
};

const buildUrlFromState = (currentPath, viewMode, searchQuery) => {
    if (typeof window === "undefined") return "/";
    const params = new URLSearchParams();
    if (viewMode && viewMode !== "title") params.set("view", viewMode);
    if (currentPath && currentPath.length > 0) params.set("path", currentPath.join("/"));
    if (searchQuery) params.set("q", searchQuery);
    const query = params.toString();
    return `${window.location.pathname}${query ? `?${query}` : ""}`;
};

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgClass = type === "error" ? "bg-red-600" : "bg-green-600";

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 toast-enter">
            <div
                className={`${bgClass} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3`}
            >
                <Icon
                    name={type === "error" ? "alert-circle" : "check-circle"}
                    className="w-5 h-5"
                />
                <span className="font-medium">{message}</span>
            </div>
        </div>
    );
};

// --- Components ---

const Breadcrumbs = ({ path, onNavigate }) => {
    return (
        <div className="flex items-center gap-2 text-lg font-medium text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-nowrap pb-2">
            <button
                onClick={() => onNavigate([])}
                className={`flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 ${path.length === 0 ? "text-gray-900 dark:text-white font-bold" : ""
                    }`}
            >
                <Icon name="library" className="w-5 h-5" />
                Library
            </button>
            {path.map((segment, index) => (
                <React.Fragment key={index}>
                    <Icon
                        name="chevron-right"
                        className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                    />
                    <button
                        onClick={() => onNavigate(path.slice(0, index + 1))}
                        className={`hover:text-blue-600 dark:hover:text-blue-400 ${index === path.length - 1 ? "text-gray-900 dark:text-white font-bold" : ""
                            }`}
                    >
                        {segment}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

const FolderCard = ({ name, items, coverItems, onClick }) => {
    const coverSource = coverItems && coverItems.length > 0 ? coverItems : items;
    const coverItem =
        coverSource.find((i) => i.hidden && (i.tags || []).includes("_cover")) ||
        coverSource.find((i) => (i.tags || []).includes("_cover")) ||
        coverSource.find((i) => i.type === "image") ||
        coverSource[0];

    const visibleCount = items.filter((i) => !i.hidden).length;

    return (
        <div
            onClick={onClick}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer flex flex-col h-full relative"
        >
            <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                {coverItem ? (
                    coverItem.type === "image" ? (
                        <img
                            src={coverItem.path}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                            <Icon name="play-circle" className="w-12 h-12 opacity-50" />
                        </div>
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-300 dark:text-gray-500">
                        <Icon name="folder" className="w-16 h-16" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
            </div>
            <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate mb-1">
                    {name}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{visibleCount} items</span>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <span>Open</span>
                        <Icon name="arrow-right" className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const FileCard = ({ item, onClick, onEdit, onSetCover, selectionMode, isSelected, onToggleSelect }) => {
    const tags = item.tags || [];

    const handleClick = () => {
        if (selectionMode) {
            onToggleSelect(item.id);
        } else {
            onClick();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border flex flex-col relative cursor-pointer ${
                isSelected
                    ? "border-blue-500 ring-2 ring-blue-500"
                    : "border-gray-100 dark:border-gray-700"
            }`}
        >
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                {item.type === "video" ? (
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

                {!selectionMode && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {item.type === "image" && (
                            <button
                                onClick={(e) => onSetCover(item, e)}
                                className={`p-1.5 rounded-full shadow-sm ${tags.includes("_cover")
                                    ? "bg-yellow-400 text-white"
                                    : "bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:text-yellow-500 hover:bg-white dark:hover:bg-gray-700"
                                    }`}
                                title="Set as Folder Cover"
                            >
                                <Icon
                                    name="star"
                                    className={`w-4 h-4 ${tags.includes("_cover") ? "fill-current" : ""
                                        }`}
                                />
                            </button>
                        )}
                        <button
                            onClick={(e) => onEdit(item, e)}
                            className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600"
                            title="Edit Details"
                        >
                            <Icon name="edit-2" className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {tags.includes("_cover") && !selectionMode && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                        COVER
                    </div>
                )}

                {selectionMode && (
                    <div
                        className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                            isSelected
                                ? "bg-blue-500 border-blue-500 text-white"
                                : "bg-white/90 dark:bg-gray-800/90 border-gray-300 dark:border-gray-600"
                        }`}
                    >
                        {isSelected && <Icon name="check" className="text-sm" />}
                    </div>
                )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <h3
                    className="font-medium text-gray-900 dark:text-white truncate mb-1"
                    title={item.custom_title || item.original_name}
                >
                    {item.custom_title || item.original_name}
                </h3>
                <div className="mt-auto flex flex-wrap gap-1">
                    {tags
                        .filter((t) => t !== "_cover")
                        .slice(0, 2)
                        .map((tag, idx) => (
                            <span
                                key={idx}
                                className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600"
                            >
                                #{tag}
                            </span>
                        ))}
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const initialUiState = { ...(readUiState() || {}), ...(readUrlState() || {}) };
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [serverActive, setServerActive] = useState(false);
    const [branding, setBranding] = useState({
        site_name: "MediaServer",
        site_name_accent: "Local",
        footer_message: "",
        font_family: "system-ui, -apple-system, sans-serif",
        heading_font_family: ""
    });
    const [darkMode, setDarkMode] = useState(false);
    const [defaultTheme, setDefaultTheme] = useState("system");

    const [currentPath, setCurrentPath] = useState(initialUiState?.currentPath || []);

    const [searchInput, setSearchInput] = useState(initialUiState?.searchInput || "");
    const [searchQuery, setSearchQuery] = useState(initialUiState?.searchQuery || "");
    const [viewMode, setViewMode] = useState(initialUiState?.viewMode || "title"); // "title" or "category"

    const [visibleCount, setVisibleCount] = useState(initialUiState?.visibleCount || 48);
    const hasPushedUrl = useRef(false);
    const isPopState = useRef(false);

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [viewMedia, setViewMedia] = useState(null);
    const [hasRestoredState, setHasRestoredState] = useState(false);

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    const [scanning, setScanning] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState(null);

    const [uploadForm, setUploadForm] = useState({
        file: null,
        title: "",
        category: "General",
        tags: "",
        is_hidden: false,
    });

    const [editForm, setEditForm] = useState({
        id: null,
        custom_title: '',
        title: '',
        tags: '',
        category: '',
    });

    const [bulkEditForm, setBulkEditForm] = useState({
        tags: "",
        category: "",
        tagMode: "add", // "add" or "replace"
    });

    // Initialize Lucide icons after each render where UI might change
    //   useEffect(() => {
    //     if (window.lucide && window.lucide.createIcons) {
    //       window.lucide.createIcons();
    //     }
    //   }, [media, viewMedia, isUploadOpen, isEditOpen, isRenameOpen, scanning, toast]);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/config");
            if (res.ok) {
                const data = await res.json();
                if (data.branding) {
                    setBranding(prev => ({ ...prev, ...data.branding }));
                }
                if (data.appearance?.default_theme) {
                    setDefaultTheme(data.appearance.default_theme);
                }
            }
        } catch (err) {
            console.log("Could not fetch config, using defaults");
        }
    };

    // Initialize theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setDarkMode(savedTheme === 'dark');
        } else if (defaultTheme === 'system') {
            setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
        } else {
            setDarkMode(defaultTheme === 'dark');
        }
    }, [defaultTheme]);

    // Apply dark mode class to document
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
    };

    const fetchMedia = async () => {
        try {
            const res = await fetch("/api/media");
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
        fetchConfig();
        fetchMedia();
    }, []);

    const categories = [...new Set(media.map((m) => m.category))].filter(Boolean).sort();
    const titles = [...new Set(media.map((m) => m.title))].filter(Boolean).sort();

    const getFileSortKey = (item) => (item.original_name || item.filename || "").toLowerCase();

    const getPathSegments = (itemPath) => {
        if (!itemPath || typeof itemPath !== "string") return [];
        const marker = "/media_content/";
        const idx = itemPath.indexOf(marker);
        const sub = idx >= 0 ? itemPath.slice(idx + marker.length) : itemPath.replace(/^\/+/, "");
        return sub.split("/").filter(Boolean);
    };

    const isPrefix = (full, prefix) => {
        if (prefix.length > full.length) return false;
        for (let i = 0; i < prefix.length; i += 1) {
            if (full[i] !== prefix[i]) return false;
        }
        return true;
    };

    const getFolderSegments = (itemPath) => {
        const segments = getPathSegments(itemPath);
        if (segments.length <= 1) return [];
        return segments.slice(0, -1);
    };

    const getRelativeFolderSegments = (itemPath, groupName) => {
        const folderSegments = getFolderSegments(itemPath);
        if (folderSegments.length === 0) return [];
        if (folderSegments[0] === groupName) return folderSegments.slice(1);
        return folderSegments;
    };

    const getCoverScopeKey = (itemPath) => {
        const segments = getPathSegments(itemPath);
        if (segments.length === 0) return "";
        const root = segments[0];
        const subfolders = segments.slice(1, -1);
        return `${root}::${subfolders.join("/")}`;
    };

    const viewContent = useMemo(() => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const items = media.filter((item) => {
                if (item.hidden) return false;
                const displayTitle = item.custom_title || item.original_name;
                const matchesText =
                    displayTitle.toLowerCase().includes(q) ||
                    (item.tags || []).some((t) => t.toLowerCase().includes(q)) ||
                    (item.title || "").toLowerCase().includes(q) ||
                    (item.category || "").toLowerCase().includes(q);
                return matchesText;
            });
            const sortedItems = [...items].sort((a, b) =>
                getFileSortKey(a).localeCompare(getFileSortKey(b), undefined, { numeric: true })
            );
            return { mode: "search", folders: [], files: sortedItems };
        }

        // Determine grouping field based on view mode
        const groupField = viewMode === "category" ? "category" : "title";

        // At root level (no currentPath), show folders grouped by the selected field
        if (currentPath.length === 0) {
            const groups = {};
            media.forEach((item) => {
                const groupName = item[groupField] || "Uncategorized";
                if (!groups[groupName]) {
                    groups[groupName] = { name: groupName, items: [], coverItems: [] };
                }
                groups[groupName].items.push(item);
                const relFolders = getRelativeFolderSegments(item.path, groupName);
                if (relFolders.length === 0) {
                    groups[groupName].coverItems.push(item);
                }
            });

            return {
                mode: "browse",
                folders: Object.values(groups).sort((a, b) => a.name.localeCompare(b.name)),
                files: [],
            };
        }

        // Inside a folder - show nested folders/files based on media path
        const selectedGroup = currentPath[0];
        const subPath = currentPath.slice(1);

        const groupItems = media.filter((item) => {
            if (item.hidden) return false;
            return item[groupField] === selectedGroup;
        });

        const foldersMap = {};
        const files = [];

        groupItems.forEach((item) => {
            const relativeSegments = getRelativeFolderSegments(item.path, selectedGroup);

            if (!isPrefix(relativeSegments, subPath)) return;

            if (relativeSegments.length > subPath.length) {
                const nextName = relativeSegments[subPath.length];
                if (!foldersMap[nextName]) {
                    foldersMap[nextName] = { name: nextName, items: [], coverItems: [] };
                }
                foldersMap[nextName].items.push(item);
                if (relativeSegments.length === subPath.length + 1) {
                    foldersMap[nextName].coverItems.push(item);
                }
            } else {
                files.push(item);
            }
        });

        return {
            mode: "browse",
            folders: Object.values(foldersMap).sort((a, b) => a.name.localeCompare(b.name)),
            files: files.sort((a, b) =>
                getFileSortKey(a).localeCompare(getFileSortKey(b), undefined, { numeric: true })
            ),
        };
    }, [media, currentPath, searchQuery, viewMode]);

    const visibleFiles = useMemo(() => {
        return viewContent.files.slice(0, visibleCount);
    }, [viewContent, visibleCount]);

    const handleSearch = () => {
        setSearchQuery(searchInput);
        setVisibleCount(48);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const navigateToFolder = (folderName) => {
        setCurrentPath([...currentPath, folderName]);
        setVisibleCount(48);
        setSearchQuery("");
        setSearchInput("");
    };

    const navigateUp = (newPath) => {
        setCurrentPath(newPath);
        setVisibleCount(48);
        setSearchQuery("");
        setSearchInput("");
    };

    const handleScan = async () => {
        if (!serverActive) return showToast("Server not active", "error");
        setScanning(true);
        try {
            const res = await fetch("/api/scan", { method: "POST" });
            const data = await res.json();
            showToast(data.message, "success");
            fetchMedia();
        } catch (e) {
            showToast("Scan failed", "error");
        } finally {
            setScanning(false);
        }
    };

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 48);
    };

    const handleSetCover = async (item, e) => {
        e.stopPropagation();
        if (!serverActive) return showToast("Server offline", "error");
        setProcessing(true);
        const scopeKey = getCoverScopeKey(item.path);
        const oldCover = media.find(
            (m) => (m.tags || []).includes("_cover") && getCoverScopeKey(m.path) === scopeKey
        );

        try {
            if (oldCover && oldCover.id !== item.id) {
                const newTags = (oldCover.tags || []).filter((t) => t !== "_cover");
                await fetch(`/api/update/${oldCover.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tags: newTags }),
                });
            }
            if (!(item.tags || []).includes("_cover")) {
                const newTags = [...(item.tags || []), "_cover"];
                await fetch(`/api/update/${item.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tags: newTags }),
                });
                showToast("Cover updated");
                fetchMedia();
            } else {
                showToast("Already the cover");
            }
        } catch (err) {
            showToast("Failed to set cover", "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleUploadChange = (e) => {
        const { name, value, files, type, checked } = e.target;
        setUploadForm((prev) => ({
            ...prev,
            [name]: type === "file" ? files[0] : type === "checkbox" ? checked : value,
        }));
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        const formData = new FormData();
        formData.append("file", uploadForm.file);
        formData.append("title", uploadForm.title);
        formData.append("category", uploadForm.category);
        formData.append("tags", uploadForm.tags);
        formData.append("is_hidden", uploadForm.is_hidden);

        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
                setIsUploadOpen(false);
                setUploadForm({
                    file: null,
                    title: "",
                    category: "General",
                    tags: "",
                    is_hidden: false,
                });
                showToast("File uploaded successfully");
                fetchMedia();
            } else showToast("Upload failed", "error");
        } catch (error) {
            showToast("Error uploading", "error");
        } finally {
            setProcessing(false);
        }
    };

    const buildEditForm = (item) => ({
        id: item.id,
        custom_title: item.custom_title || '',
        title: item.title || '',
        tags: (item.tags || []).filter(t => t !== '_cover').join(', '),
        category: item.category || '',
    });

    const openEditModal = (item, e) => {
        if (e) e.stopPropagation();
        setEditForm(buildEditForm(item));
        setIsEditOpen(true);
    };

    const openViewMedia = (item) => {
        setViewMedia(item);
        setEditForm(buildEditForm(item));
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedItems(new Set());
    };

    const toggleItemSelection = (itemId, e) => {
        if (e) e.stopPropagation();
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const selectAllVisible = () => {
        const allIds = visibleFiles.map(item => item.id);
        setSelectedItems(new Set(allIds));
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
    };

    const openBulkEditModal = () => {
        setBulkEditForm({ tags: "", category: "", tagMode: "add" });
        setIsBulkEditOpen(true);
    };

    const handleBulkEditSubmit = async (e) => {
        e.preventDefault();
        if (selectedItems.size === 0) return;

        setProcessing(true);
        const updates = [];

        for (const itemId of selectedItems) {
            const item = media.find(m => m.id === itemId);
            if (!item) continue;

            const update = { id: itemId };

            // Handle category
            if (bulkEditForm.category.trim()) {
                update.category = bulkEditForm.category.trim();
            }

            // Handle tags
            if (bulkEditForm.tags.trim()) {
                const newTags = bulkEditForm.tags.split(",").map(t => t.trim()).filter(Boolean);
                const existingTags = item.tags || [];
                const hasCover = existingTags.includes("_cover");

                if (bulkEditForm.tagMode === "replace") {
                    update.tags = hasCover ? [...newTags, "_cover"] : newTags;
                } else {
                    // Add mode - merge tags
                    const mergedTags = [...new Set([...existingTags.filter(t => t !== "_cover"), ...newTags])];
                    if (hasCover) mergedTags.push("_cover");
                    update.tags = mergedTags;
                }
            }

            if (Object.keys(update).length > 1) {
                updates.push(update);
            }
        }

        try {
            const res = await fetch("/api/batch_update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates }),
            });
            if (res.ok) {
                showToast(`Updated ${updates.length} items`);
                setIsBulkEditOpen(false);
                setSelectedItems(new Set());
                setSelectionMode(false);
                fetchMedia();
            } else {
                throw new Error();
            }
        } catch (err) {
            showToast("Error updating items", "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        const originalItem = media.find((m) => m.id === editForm.id);
        const isCover = (originalItem?.tags || []).includes("_cover");
        let tagList = editForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        if (isCover) tagList.push("_cover");

        try {
            const res = await fetch(`/api/update/${editForm.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...editForm, tags: tagList }),
            });
            if (res.ok) {
                setIsEditOpen(false);
                showToast("Details updated");
                fetchMedia();
            } else showToast("Update failed", "error");
        } catch (error) {
            showToast("Error updating", "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleLightboxSave = async (e) => {
        e.preventDefault();
        if (!viewMedia) return;
        setProcessing(true);
        const originalItem = media.find((m) => m.id === editForm.id);
        const isCover = (originalItem?.tags || []).includes("_cover");
        let tagList = editForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        if (isCover) tagList.push("_cover");

        try {
            const res = await fetch(`/api/update/${editForm.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editForm.id,
                    custom_title: editForm.custom_title,
                    title: editForm.title,
                    category: editForm.category,
                    tags: tagList,
                }),
            });
            if (res.ok) {
                showToast("Details updated");
                fetchMedia();
                setViewMedia((prev) =>
                    prev
                        ? { ...prev, custom_title: editForm.custom_title, tags: tagList }
                        : prev
                );
            } else showToast("Update failed", "error");
        } catch (error) {
            showToast("Error updating", "error");
        } finally {
            setProcessing(false);
        }
    };

    const lightboxItems = useMemo(() => visibleFiles, [visibleFiles]);
    const lightboxIndex = useMemo(() => {
        if (!viewMedia) return -1;
        return lightboxItems.findIndex((item) => item.id === viewMedia.id);
    }, [lightboxItems, viewMedia]);

    const goToLightboxIndex = (nextIndex) => {
        if (nextIndex < 0 || nextIndex >= lightboxItems.length) return;
        const nextItem = lightboxItems[nextIndex];
        if (!nextItem) return;
        openViewMedia(nextItem);
    };

    const handleLightboxPrev = (e) => {
        if (e) e.stopPropagation();
        if (lightboxIndex <= 0) return;
        goToLightboxIndex(lightboxIndex - 1);
    };

    const handleLightboxNext = (e) => {
        if (e) e.stopPropagation();
        if (lightboxIndex === -1 || lightboxIndex >= lightboxItems.length - 1) return;
        goToLightboxIndex(lightboxIndex + 1);
    };

    useEffect(() => {
        if (!viewMedia) return;
        const handleKeyDown = (e) => {
            const target = e.target;
            const isFormField =
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable);
            if (isFormField) return;
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                handleLightboxPrev();
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                handleLightboxNext();
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setViewMedia(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [viewMedia, lightboxIndex, lightboxItems.length]);

    const saveUiState = useCallback(
        (overrides = {}) => {
            const payload = {
                currentPath,
                searchInput,
                searchQuery,
                viewMode,
                visibleCount,
                viewMediaId: viewMedia?.id || null,
                scrollY: window.scrollY,
                ...overrides,
            };
            try {
                localStorage.setItem("ui_state", JSON.stringify(payload));
            } catch (err) {
                // ignore write errors (private mode, storage full, etc)
            }
        },
        [currentPath, searchInput, searchQuery, viewMode, visibleCount, viewMedia]
    );

    useEffect(() => {
        saveUiState();
    }, [saveUiState]);

    useEffect(() => {
        const handlePopState = (event) => {
            isPopState.current = true;
            const state = event.state || readUrlState() || {};
            setViewMode(state.viewMode || "title");
            setCurrentPath(state.currentPath || []);
            const q = state.searchQuery || "";
            setSearchQuery(q);
            setSearchInput(q);
            setVisibleCount(48);
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        const url = buildUrlFromState(currentPath, viewMode, searchQuery);
        const state = { currentPath, viewMode, searchQuery };

        if (isPopState.current) {
            isPopState.current = false;
            window.history.replaceState(state, "", url);
            return;
        }

        if (!hasPushedUrl.current) {
            window.history.replaceState(state, "", url);
            hasPushedUrl.current = true;
        } else {
            window.history.pushState(state, "", url);
        }
    }, [currentPath, viewMode, searchQuery]);

    useEffect(() => {
        const handleScroll = () => saveUiState();
        const handleBeforeUnload = () => saveUiState();
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [saveUiState]);

    useEffect(() => {
        if (loading || hasRestoredState) return;
        const saved = initialUiState;
        if (saved?.scrollY != null) {
            window.scrollTo(0, saved.scrollY);
        }
        if (saved?.viewMediaId) {
            const match = media.find((item) => item.id === saved.viewMediaId);
            if (match) openViewMedia(match);
        }
        setHasRestoredState(true);
    }, [loading, hasRestoredState, media]);

    // Build custom font style
    const fontStyle = {
        fontFamily: branding.font_family || "system-ui, -apple-system, sans-serif"
    };
    const headingFontStyle = branding.heading_font_family
        ? { fontFamily: branding.heading_font_family }
        : fontStyle;

    return (
        <div className="min-h-screen flex flex-col relative pb-20 bg-gray-100 dark:bg-gray-900 transition-colors" style={fontStyle}>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {scanning && (
                <div className="fixed bottom-6 right-6 z-40 scan-overlay">
                    <div className="bg-blue-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-4">
                        <Icon name="loader-2" className="animate-spin w-6 h-6" />
                        <div>
                            <h4 className="font-semibold">Scanning Library...</h4>
                            <p className="text-xs text-blue-100">
                                This may take a moment
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {viewMedia && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={() => setViewMedia(null)}
                >
                    <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-50">
                        <Icon name="x" className="w-8 h-8" />
                    </button>
                    <button
                        className={`absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-[30px] rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors ${lightboxIndex <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                        onClick={handleLightboxPrev}
                        disabled={lightboxIndex <= 0}
                        title="Previous"
                    >
                        <Icon name="chevron-left" className="text-[80px] leading-none" />
                    </button>
                    <button
                        className={`absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-[30px] rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors ${lightboxIndex === -1 || lightboxIndex >= lightboxItems.length - 1 ? "opacity-40 cursor-not-allowed" : ""}`}
                        onClick={handleLightboxNext}
                        disabled={lightboxIndex === -1 || lightboxIndex >= lightboxItems.length - 1}
                        title="Next"
                    >
                        <Icon name="chevron-right" className="text-[80px] leading-none" />
                    </button>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-white z-40"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold">
                            {viewMedia.custom_title || viewMedia.original_name}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-white/80">
                            <span className="flex items-center gap-1">
                                <Icon name="library" className="w-4 h-4" /> {viewMedia.title}
                            </span>
                            <span className="flex items-center gap-1">
                                <Icon name="folder" className="w-4 h-4" /> {viewMedia.category}
                            </span>
                            {(viewMedia.tags || []).length > 0 && (
                                <div className="flex gap-2">
                                    {(viewMedia.tags || [])
                                        .filter((t) => t !== "_cover")
                                        .map((t, i) => (
                                            <span
                                                key={i}
                                                className="bg-white/20 px-2 py-0.5 rounded text-sm"
                                            >
                                                #{t}
                                            </span>
                                        ))}
                                </div>
                            )}
                        </div>
                        <form
                            onSubmit={handleLightboxSave}
                            className="mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 max-w-3xl"
                        >
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs uppercase tracking-wide text-white/70 mb-1">
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Custom display name (optional)"
                                        className="w-full border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={editForm.custom_title}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({ ...prev, custom_title: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs uppercase tracking-wide text-white/70 mb-1">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="tag1, tag2, tag3"
                                        className="w-full border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={editForm.tags}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({ ...prev, tags: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors ${processing ? "opacity-60 cursor-not-allowed" : ""
                                            }`}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-white/60 mt-2">
                                Separate multiple tags with commas
                            </p>
                        </form>
                    </div>
                    <div className="w-full h-full flex items-center justify-center p-4 lightbox-enter">
                        {viewMedia.type === "image" ? (
                            <img
                                src={viewMedia.path}
                                alt={viewMedia.original_name}
                                className="max-h-full max-w-full object-contain rounded shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <video
                                src={viewMedia.path}
                                className="max-h-full max-w-full rounded shadow-2xl"
                                controls
                                autoPlay
                                preload="auto"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                    </div>
                </div>
            )}

            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigateUp([])}
                    >
                        <Icon name="hard-drive" className="text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block" style={headingFontStyle}>
                            {branding.site_name}<span className="text-blue-600 dark:text-blue-400">{branding.site_name_accent}</span>
                        </h1>
                    </div>
                    <div className="flex-1 max-w-lg relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
                                <Icon name="search" className="w-5 h-5" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search files..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                            title="Search"
                        >
                            <Icon name="arrow-right" className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleDarkMode}
                            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded-lg transition-colors"
                            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            <Icon name={darkMode ? "sun" : "moon"} className="w-5 h-5" />
                        </button>
                        <button
                            onClick={toggleSelectionMode}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                                selectionMode
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                            }`}
                            title="Toggle selection mode"
                        >
                            <Icon name="select" className="w-4 h-4" />
                            <span className="hidden md:inline">{selectionMode ? "Cancel" : "Select"}</span>
                        </button>
                        <button
                            onClick={handleScan}
                            disabled={scanning}
                            className={`bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${scanning ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            <Icon
                                name="refresh-cw"
                                className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`}
                            />
                            <span className="hidden md:inline">
                                {scanning ? "Scanning..." : "Scan"}
                            </span>
                        </button>
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Icon name="upload-cloud" className="w-4 h-4" />
                            <span className="hidden md:inline">Upload</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {!serverActive && (
                    <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Preview Mode: Python server not detected.
                        </p>
                    </div>
                )}

                <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {searchQuery ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSearchInput("");
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <Icon name="arrow-left" className="w-4 h-4" /> Back
                                </button>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    Search: "{searchQuery}"
                                </h2>
                            </div>
                        ) : (
                            <Breadcrumbs path={currentPath} onNavigate={navigateUp} />
                        )}
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => { setViewMode("title"); setCurrentPath([]); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === "title"
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                            By Title
                        </button>
                        <button
                            onClick={() => { setViewMode("category"); setCurrentPath([]); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === "category"
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                            By Category
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {viewContent.folders.length === 0 &&
                            viewContent.files.length === 0 && (
                                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                    <Icon
                                        name="folder-open"
                                        className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-2"
                                    />
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {searchQuery ? "No matches found" : "Empty Folder"}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                        {searchQuery
                                            ? "Try a different term"
                                            : "No media found in this location"}
                                    </p>
                                </div>
                            )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {viewContent.folders.map((folder) => (
                                <FolderCard
                                    key={folder.name}
                                    name={folder.name}
                                    items={folder.items}
                                    coverItems={folder.coverItems}
                                    onClick={() => navigateToFolder(folder.name)}
                                />
                            ))}
                            {visibleFiles.map((item) => (
                                <FileCard
                                    key={item.id}
                                    item={item}
                                    onClick={() => openViewMedia(item)}
                                    onEdit={openEditModal}
                                    onSetCover={handleSetCover}
                                    selectionMode={selectionMode}
                                    isSelected={selectedItems.has(item.id)}
                                    onToggleSelect={toggleItemSelection}
                                />
                            ))}
                        </div>

                        {viewContent.files.length > visibleCount && (
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={handleLoadMore}
                                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
                                >
                                    Load More (
                                    {viewContent.files.length - visibleFiles.length} remaining)
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {isEditOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-black/50 transition-opacity"
                            onClick={() => setIsEditOpen(false)}
                        ></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md z-10 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Media</h3>
                                <button onClick={() => setIsEditOpen(false)}>
                                    <Icon name="x" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                                        <input
                                            type="text"
                                            placeholder="Custom display name (optional)"
                                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                            value={editForm.custom_title}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, custom_title: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                                        <input
                                            type="text"
                                            list="edit-titles-list"
                                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={editForm.title || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                        />
                                        <datalist id="edit-titles-list">
                                            {titles.map((t) => (
                                                <option key={t} value={t} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                        <input
                                            type="text"
                                            list="edit-categories-list"
                                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={editForm.category}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                        />
                                        <datalist id="edit-categories-list">
                                            {categories.map((c) => (
                                                <option key={c} value={c} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                                        <input
                                            type="text"
                                            placeholder="tag1, tag2, tag3"
                                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                            value={editForm.tags}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate multiple tags with commas</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditOpen(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isUploadOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-black/50 transition-opacity"
                            onClick={() => setIsUploadOpen(false)}
                        ></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg z-10 p-6">
                            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Upload Media</h3>
                            <form onSubmit={handleUploadSubmit}>
                                <div className="space-y-4">
                                    <input
                                        type="file"
                                        name="file"
                                        onChange={handleUploadChange}
                                        required
                                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                                    />
                                    <input
                                        type="text"
                                        name="title"
                                        list="titles-list"
                                        placeholder="Title"
                                        required
                                        className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                        value={uploadForm.title}
                                        onChange={handleUploadChange}
                                    />
                                    <datalist id="titles-list">
                                        {titles.map((t) => (
                                            <option key={t} value={t} />
                                        ))}
                                    </datalist>
                                    <input
                                        type="text"
                                        name="category"
                                        placeholder="Category"
                                        required
                                        className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                        value={uploadForm.category}
                                        onChange={handleUploadChange}
                                    />
                                    <div>
                                        <input
                                            type="text"
                                            name="tags"
                                            placeholder="tag1, tag2, tag3"
                                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                            value={uploadForm.tags}
                                            onChange={handleUploadChange}
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate multiple tags with commas</p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_hidden"
                                            id="is_hidden"
                                            checked={uploadForm.is_hidden}
                                            onChange={handleUploadChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                        />
                                        <label
                                            htmlFor="is_hidden"
                                            className="ml-2 block text-sm text-gray-900 dark:text-gray-200"
                                        >
                                            Use as Hidden Collection Cover
                                        </label>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsUploadOpen(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        {processing ? "Uploading..." : "Save"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isBulkEditOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-black/50 transition-opacity"
                            onClick={() => setIsBulkEditOpen(false)}
                        ></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md z-10 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Bulk Edit ({selectedItems.size} items)
                                </h3>
                                <button onClick={() => setIsBulkEditOpen(false)}>
                                    <Icon name="x" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Leave fields empty to keep existing values.
                            </p>
                            <form onSubmit={handleBulkEditSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Category
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter new category"
                                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                            value={bulkEditForm.category}
                                            onChange={(e) => setBulkEditForm(prev => ({ ...prev, category: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Tags
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="tag1, tag2, tag3"
                                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                            value={bulkEditForm.tags}
                                            onChange={(e) => setBulkEditForm(prev => ({ ...prev, tags: e.target.value }))}
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate multiple tags with commas</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tag Mode
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tagMode"
                                                    value="add"
                                                    checked={bulkEditForm.tagMode === "add"}
                                                    onChange={(e) => setBulkEditForm(prev => ({ ...prev, tagMode: e.target.value }))}
                                                    className="text-blue-600"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Add to existing</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tagMode"
                                                    value="replace"
                                                    checked={bulkEditForm.tagMode === "replace"}
                                                    onChange={(e) => setBulkEditForm(prev => ({ ...prev, tagMode: e.target.value }))}
                                                    className="text-blue-600"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Replace all</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsBulkEditOpen(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || (!bulkEditForm.tags.trim() && !bulkEditForm.category.trim())}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? "Updating..." : "Apply to All"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {selectionMode && selectedItems.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {selectedItems.size} selected
                        </span>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <button
                            onClick={selectAllVisible}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Select All
                        </button>
                        <button
                            onClick={clearSelection}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                        >
                            Clear
                        </button>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <button
                            onClick={openBulkEditModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <Icon name="tag" className="w-4 h-4" />
                            Edit Tags & Category
                        </button>
                    </div>
                </div>
            )}

            {branding.footer_message && !selectionMode && (
                <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {branding.footer_message}
                </footer>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
