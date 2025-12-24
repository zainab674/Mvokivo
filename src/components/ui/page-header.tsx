import React from 'react';
import { cn } from '@/lib/utils';
import InfoTooltip from './info-tooltip';

interface PageHeaderProps {
    title: string;
    description?: string;
    tooltipTitle?: string;
    tooltipDescription?: string;
    className?: string;
    children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    tooltipTitle,
    tooltipDescription,
    className,
    children
}) => {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4", className)}>
            <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                    {tooltipTitle && tooltipDescription && (
                        <InfoTooltip
                            title={tooltipTitle}
                            description={tooltipDescription}
                            className="ml-1"
                        />
                    )}
                </div>
                {description && (
                    <p className="text-muted-foreground text-sm sm:text-base">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center space-x-3">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
