import { getFileTypeIconProps, initializeFileTypeIcons } from '@fluentui/react-file-type-icons';

// Fix for deprecated Fluent UI CDN - use local/npm-based icons instead of CDN
initializeFileTypeIcons(/* baseUrl */ undefined);

const getFileIcon = (fileName: string): string => {
    const iconProps = getFileTypeIconProps({ extension: /\.(.+)/i.exec(fileName)?.[1], imageFileType: 'png', size: 16 });
    return iconProps.iconName;
};

export default getFileIcon;
