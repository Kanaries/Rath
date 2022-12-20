import { getFileTypeIconProps, initializeFileTypeIcons } from '@fluentui/react-file-type-icons';


initializeFileTypeIcons();

const getFileIcon = (fileName: string): string => {
    const iconProps = getFileTypeIconProps({ extension: /(?<=\.).+/i.exec(fileName)?.[0], imageFileType: 'png', size: 16 });
    return iconProps.iconName;
};

export default getFileIcon;
