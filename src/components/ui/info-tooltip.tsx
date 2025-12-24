import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
    title: string;
    description: string;
    className?: string;
    iconClassName?: string;
    tooltipClassName?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
    title,
    description,
    className,
    iconClassName,
    tooltipClassName
}) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className={cn("relative inline-block", className)}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <HelpCircle
                className={cn(
                    "h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help",
                    iconClassName
                )}
            />

            {isVisible && (
                <div className={cn(
                    "absolute z-50 w-80 p-4 bg-popover border border-border rounded-lg shadow-lg",
                    "left-1/2 transform -translate-x-1/2 translate-y-2",
                    "mt-2 pointer-events-none",
                    "before:content-[''] before:absolute before:bottom-full before:left-1/2 before:transform before:-translate-x-1/2",
                    "before:border-8 before:border-transparent before:border-b-popover",
                    tooltipClassName
                )}>
                    <h4 className="font-semibold text-sm text-foreground mb-2">
                        {title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
            )}
        </div>
    );
};

export default InfoTooltip;
