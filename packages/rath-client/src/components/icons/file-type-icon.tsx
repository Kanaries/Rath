import type { LucideIcon, LucideProps } from 'lucide-react';
import {
    Code2,
    Database,
    File,
    FileArchive,
    FileAudio,
    FileChartColumn,
    FileCode,
    FileImage,
    FileJson,
    FileSpreadsheet,
    FileText,
    FileType,
    FileVideo,
    Table,
} from 'lucide-react';

const fileTypeIconMap: Record<string, LucideIcon> = {
    CodeEdit: FileJson,
    Database,
    ExcelDocument: FileSpreadsheet,
    FileCode,
    FileCSS: Code2,
    FileHTML: Code2,
    FileImage,
    MarkDownLanguage: FileText,
    MusicInCollection: FileAudio,
    Page: File,
    PDF: FileType,
    PowerPointDocument: FileChartColumn,
    Table,
    TextDocument: FileText,
    Video: FileVideo,
    WordDocument: FileText,
    ZipFolder: FileArchive,
};

export interface FileTypeIconProps extends Omit<LucideProps, 'ref'> {
    type: string;
    title?: string;
}

export function FileTypeIcon({ type, title, size = 20, strokeWidth = 1.75, ...props }: FileTypeIconProps) {
    const Icon = fileTypeIconMap[type] ?? File;

    return (
        <Icon
            aria-hidden={title ? undefined : true}
            aria-label={title}
            role={title ? 'img' : undefined}
            size={size}
            strokeWidth={strokeWidth}
            {...props}
        />
    );
}
