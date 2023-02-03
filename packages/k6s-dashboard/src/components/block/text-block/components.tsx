import type { Options } from 'react-markdown';

const markdownComponentsMap: Required<Options>['components'] = {
    a: ({ children, style, ...props }) => {
        return (
            <a
                {...props}
                target="_blank"
                rel="noreferrer"
                style={{
                    ...style,
                    margin: '0.3em 0.2em',
                    display: 'inline-block',
                }}
            >
                {children}
            </a>
        );
    },
};

export default markdownComponentsMap;
