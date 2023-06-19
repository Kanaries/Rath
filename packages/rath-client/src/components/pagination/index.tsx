import { Icon } from "@fluentui/react";
import { Fragment, type HTMLAttributes, memo } from "react";
import P from './components';
import { type UsePaginationItem, usePagination } from "./hooks";


export interface IPaginationProps {
    pageCount: number;
    /** starting from 1, show only the head if not given */
    pageIdx?: number;
    onChange?: (idx: number) => void;
    description?: string;
    prevBtnText?: string;
    nextBtnText?: string;
}

const Pagination = memo<IPaginationProps & Omit<HTMLAttributes<HTMLDivElement>, keyof IPaginationProps>>(function Pagination ({
    pageCount, pageIdx, onChange, description, prevBtnText = 'Prev', nextBtnText = 'Next', ...attrs
}) {
    const { items, isFallback } = usePagination({
        count: pageCount,
        page: pageIdx,
        onChange: (_, page) => onChange?.(page),
    });

    const renderCurrentPage = (item: UsePaginationItem & { type: 'page' }) => (
        <P.CurrentTab
            aria-current="page"
            role="button"
            tabIndex={0}
            data-link-source="pagination"
        >
            {item.page}
        </P.CurrentTab>
    );

    const renderTab = (item: UsePaginationItem & { type: 'page' }) => (
        <P.Tab
            data-link-source="pagination"
            role="button"
            tabIndex={0}
            onClick={item.onClick}
        >
            {item.page}
        </P.Tab>
    );

    const renderEllipsis = () => (
        <P.Ellipsis>
            ...
        </P.Ellipsis>
    );

    const renderButton = (item: UsePaginationItem & { type: 'next' | 'previous' }) => (
        <P.Button
            aria-disabled={item.disabled}
            onClick={item.onClick}
            data-link-source="pagination"
            role="button"
            tabIndex={0}
        >
            <Icon
                iconName={item.type === 'previous' ? 'ChevronLeft' : 'ChevronRight'}
                aria-hidden="true"
            />
            <span>
                {item.type === 'previous' ? prevBtnText : nextBtnText}
            </span>
        </P.Button>
    );

    if (isFallback) {
        return (
            <P.Container {...attrs}>
                <P.ContentLg style={{ display: 'flex' }}>
                    <P.TabList aria-label="Pagination">
                        {items.map((item, i) => (
                            <Fragment key={i}>
                                {item.type === 'page' && renderTab(item as UsePaginationItem & { type: "page" })}
                                {item.type.match(/ellipse/) && renderEllipsis()}
                            </Fragment>
                        ))}
                    </P.TabList>
                </P.ContentLg>
            </P.Container>
        );
    }

    return (
        <P.Container role="navigation" {...attrs}>
            <P.ContentSm>
                {items.filter(item => item.type === 'previous' || item.type === 'next').map(item => (
                    <Fragment key={item.type}>
                        {renderButton(item as UsePaginationItem & { type: "next" | "previous" })}
                    </Fragment>
                ))}
            </P.ContentSm>
            <P.ContentLg>
                {description && (
                    <P.Description>
                        <p>{description}</p>
                    </P.Description>
                )}
                <P.TabList aria-label="Pagination">
                    {items.map((item, i) => (
                        <Fragment key={i}>
                            {(item.type === 'previous' || item.type === 'next') && renderButton(item as UsePaginationItem & { type: "next" | "previous" })}
                            {item.type === 'page' && item.selected && renderCurrentPage(item as UsePaginationItem & { type: "page" })}
                            {item.type === 'page' && !item.selected && renderTab(item as UsePaginationItem & { type: "page" })}
                            {item.type.match(/ellipse/) && renderEllipsis()}
                        </Fragment>
                    ))}
                </P.TabList>
            </P.ContentLg>
        </P.Container>
    );
});


export default Pagination;
