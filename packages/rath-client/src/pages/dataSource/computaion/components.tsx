import styled from 'styled-components';

export const ConsoleMask = styled.div({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8884',
    zIndex: 10000,
});

export const ConsoleContainer = styled.div({
    minHeight: '10vh',
    backgroundColor: '#fff',
    boxShadow: '0 0 16px #8884',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',

    '> div': {
        padding: '1em',
        display: 'flex',
        flexDirection: 'column',
        width: '30vw',
    
        '> *': {
            width: '100%',
            flexGrow: 0,
            flexShrink: 0,
            overflow: 'hidden',
        },
        '> header': {
            marginBottom: '0.6em',
        },
        '> div.editor': {
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden auto',
            '--font-family': '"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
            '--font-size': '0.95rem',
            '--letter-spacing': '0.4px',
            '--font-weight': '600',
            '--line-height': '1.5em',
            '--padding': '0.8em 1em 1.5em',
    
            '> *': {
                width: '100%',
                flexGrow: 0,
                flexShrink: 0,
                overflow: 'hidden',
            },
            '& label': {
                fontSize: '13px',
                marginBottom: '0.4em',
            },
            '& textarea': {
                color: 'transparent',
                caretColor: '#444',
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size)',
                fontWeight: 'var(--font-weight)',
                letterSpacing: 'var(--letter-spacing)',
                lineHeight: 'var(--line-height)',
                padding: 'var(--padding)',
                whiteSpace: 'pre-line',
                lineBreak: 'anywhere',
            },
            '> .content': {
                position: 'fixed',
                pointerEvents: 'none',
                overflow: 'hidden',
                
                '> pre': {
                    color: '#444',
                    width: '100%',
                    height: '100%',
                    fontFamily: 'var(--font-family)',
                    fontSize: 'var(--font-size)',
                    fontWeight: 'var(--font-weight)',
                    letterSpacing: 'var(--letter-spacing)',
                    lineHeight: 'var(--line-height)',
                    padding: 'var(--padding)',
                    backgroundColor: 'transparent',
                    overflow: 'hidden',
                    resize: 'none',
                    whiteSpace: 'break-spaces',
                    lineBreak: 'anywhere',
                },
            },
        },
        '> pre': {
            whiteSpace: 'pre-line',
            overflow: 'hidden auto',
            border: '1px solid #c81',
            padding: '0.6em 1em 1.4em',
            
            '&.err-msg': {
                margin: '1em 0',
                height: '8em',
                fontSize: '0.8rem',
                lineHeight: '1.5em',
                color: '#c22',
            },
        },
        '> .maybe': {
            overflow: 'hidden scroll',
            padding: '0.2em 0 1em',
            height: '6em',
            border: '1px solid #8888',
            borderTop: 'none',
            display: 'flex',
            flexDirection: 'column',
    
            '> *': {
                width: '100%',
                flexGrow: 0,
                flexShrink: 0,
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '0.9rem',
                lineHeight: '1.2em',
                padding: '0.2em 1em',
                display: 'flex',
                flexDirection: 'row',
                '&.highlight': {
                    backgroundColor: 'rgba(0, 120, 212, 0.12)',
                },
                ':hover': {
                    backgroundColor: 'rgba(0, 120, 212, 0.3)',
                },
    
                '> span': {
                    flexGrow: 0,
                    flexShrink: 0,
                    color: 'rgb(0, 120, 212)',
                    fontSize: '0.6rem',
                    width: '6em',
                    padding: '0 0.4em',
                    textAlign: 'center',
                },
                '> div': {
                    flexGrow: 1,
                    flexShrink: 1,
                },
            },
        },

        '> .preview': {
            flexGrow: 1,
            flexShrink: 1,
            border: '1px solid #8882',
            margin: '1em 0',
            height: '400px',
            overflow: 'hidden scroll',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',

            '> div': {
                margin: '1em 0',
                padding: '1em 2em',
                border: '1px solid',

                '> header': {
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                },
            },

            '& + div': {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                '> *': {
                    marginInline: '1em',
                },
            },
        },
    },
});