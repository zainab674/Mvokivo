
import React from 'react';
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12"
    };

    const innerSizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };

    const dotSizeClasses = {
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-2.5 h-2.5"
    };

    return (
        <div className={cn(
            "border border-white/20 rounded-xl flex items-center justify-center bg-white/5 transition-all group-hover:border-pink-500/50 group-hover:bg-pink-500/10",
            sizeClasses[size],
            className
        )}>
            <div className={cn(
                "border-2 border-white rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                innerSizeClasses[size]
            )}>
                <div className={cn(
                    "bg-pink-500 rounded-full animate-pulse",
                    dotSizeClasses[size]
                )}></div>
            </div>
        </div>
    );
};
