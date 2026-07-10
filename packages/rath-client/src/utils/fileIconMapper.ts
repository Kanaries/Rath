/**
 * File Icon Mapper
 * Maps file extensions to legacy icon names handled by RathIcon.
 */

const fileIconMap: Record<string, string> = {
    // Microsoft Office
    doc: 'WordDocument',
    docx: 'WordDocument',
    docm: 'WordDocument',
    dot: 'WordDocument',
    dotx: 'WordDocument',
    
    xls: 'ExcelDocument',
    xlsx: 'ExcelDocument',
    xlsm: 'ExcelDocument',
    xlsb: 'ExcelDocument',
    xlt: 'ExcelDocument',
    xltx: 'ExcelDocument',
    xlc: 'ExcelDocument',
    xlw: 'ExcelDocument',
    
    ppt: 'PowerPointDocument',
    pptx: 'PowerPointDocument',
    pptm: 'PowerPointDocument',
    pot: 'PowerPointDocument',
    potx: 'PowerPointDocument',
    
    // Database
    accdb: 'Database',
    mdb: 'Database',
    sql: 'Database',
    db: 'Database',
    
    // PDF
    pdf: 'PDF',
    
    // Text
    txt: 'TextDocument',
    rtf: 'TextDocument',
    
    // CSV/Data
    csv: 'Table',
    tsv: 'Table',
    
    // Code
    js: 'FileCode',
    jsx: 'FileCode',
    ts: 'FileCode',
    tsx: 'FileCode',
    py: 'FileCode',
    java: 'FileCode',
    cpp: 'FileCode',
    c: 'FileCode',
    h: 'FileCode',
    cs: 'FileCode',
    php: 'FileCode',
    rb: 'FileCode',
    go: 'FileCode',
    rs: 'FileCode',
    swift: 'FileCode',
    kt: 'FileCode',
    scala: 'FileCode',
    
    // Web
    html: 'FileHTML',
    htm: 'FileHTML',
    css: 'FileCSS',
    scss: 'FileCSS',
    sass: 'FileCSS',
    less: 'FileCSS',
    
    // Config/Data
    json: 'CodeEdit',
    xml: 'CodeEdit',
    yaml: 'CodeEdit',
    yml: 'CodeEdit',
    toml: 'CodeEdit',
    ini: 'CodeEdit',
    
    // Images
    jpg: 'FileImage',
    jpeg: 'FileImage',
    png: 'FileImage',
    gif: 'FileImage',
    bmp: 'FileImage',
    svg: 'FileImage',
    webp: 'FileImage',
    ico: 'FileImage',
    
    // Video
    mp4: 'Video',
    avi: 'Video',
    mov: 'Video',
    wmv: 'Video',
    flv: 'Video',
    mkv: 'Video',
    webm: 'Video',
    
    // Audio
    mp3: 'MusicInCollection',
    wav: 'MusicInCollection',
    ogg: 'MusicInCollection',
    flac: 'MusicInCollection',
    aac: 'MusicInCollection',
    wma: 'MusicInCollection',
    m4a: 'MusicInCollection',
    
    // Archives
    zip: 'ZipFolder',
    rar: 'ZipFolder',
    '7z': 'ZipFolder',
    tar: 'ZipFolder',
    gz: 'ZipFolder',
    bz2: 'ZipFolder',
    
    // Other
    md: 'MarkDownLanguage',
    markdown: 'MarkDownLanguage',
};

/**
 * Get a legacy icon name for a file based on its extension
 * @param fileName - The file name with extension
 * @returns legacy file icon name
 */
export function getFileIconName(fileName: string): string {
    if (!fileName) {
        return 'Page';
    }
    
    // Extract extension
    const match = /\.([^./]+)$/.exec(fileName);
    if (!match) {
        return 'Page';
    }
    
    const ext = match[1].toLowerCase();
    return fileIconMap[ext] || 'Page';
}
