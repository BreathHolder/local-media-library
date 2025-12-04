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
            const pascalName = name.replace(/(^\w|-\w)/g, (g) =>
                g.replace('-', '').toUpperCase()
            );
            const iconNode = window.lucide.icons[pascalName];
            if (iconNode) {
                setSvgHtml(iconNode.toSvg({ class: className }));
            }
        }
    }, [name, className]);

    // display: contents ensures the wrapper span doesn't mess up flex layouts
    return (
        <span
            dangerouslySetInnerHTML={{ __html: svgHtml }}
            style={{ display: 'contents' }}
        />
    );
};

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    const bgClass = type === 'error' ? 'bg-red-600' : 'bg-green-600';
    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 toast-enter">
            <div
                className={`${bgClass} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3`}
            >
                <Icon
                    name={type === 'error' ? 'alert-circle' : 'check-circle'}
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
        <div className="flex items-center gap-2 text-lg font-medium text-gray-600 overflow-x-auto whitespace-nowrap pb-2">
            <button
                onClick={() => onNavigate([])}
                className={`flex items-center gap-1 hover:text-blue-600 ${
                    path.length === 0 ? 'text-gray-900 font-bold' : ''
                }`}
            >
                <Icon name="library" className="w-5 h-5" />
                Library
            </button>
            {path.map((segment, index) => (
                <React.Fragment key={index}>
                    <Icon
                        name="chevron-right"
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                    />
                    <button
                        onClick={() => onNavigate(path.slice(0, index + 1))}
                        className={`hover:text-blue-600 ${
                            index === path.length - 1
                                ? 'text-gray-900 font-bold'
                                : ''
                        }`}
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
    const coverItem =
        items.find((i) => i.hidden && (i.tags || []).includes('_cover')) ||
        items.find((i) => (i.tags || []).includes('_cover')) ||
        items.find((i) => i.type === 'image') ||
        items[0];

    const visibleCount = items.filter((i) => !i.hidden).length;

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer flex flex-col h-full relative"
        >
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {coverItem ? (
                    coverItem.type === 'image' ? (
                        <img
                            src={coverItem.path}
                            alt={name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                            <Icon
                                name="play-circle"
                                className="w-12 h-12 opacity-50"
                            />
                        </div>
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                        <Icon name="folder" className="w-16 h-16" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                <div className="absolute center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-colors">
                    <Icon name="folder" className="w-16 h-16" />
                </div>

                {onRename && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRename(name);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-blue-50 text-gray-600 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        title="Rename Collection"
                    >
                        <Icon name="pencil" className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 truncate mb-1">
                    {name}
                </h3>
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
                                <Icon
                                    name="play"
                                    className="w-6 h-6 text-white fill-current"
                                />
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
                            className={`p-1.5 rounded-full shadow-sm ${
