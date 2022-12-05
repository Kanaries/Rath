import { getFileTypeIconProps, initializeFileTypeIcons } from '@fluentui/react-file-type-icons';


initializeFileTypeIcons();

const getFileIcon = (fileName: string): string => {
    const iconProps = getFileTypeIconProps({ extension: /(?<=\.)[a-z]+/i.exec(fileName)?.[0] });
    return iconProps.iconName;
};

export default getFileIcon;
