import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    className,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/gympilot-logo.png"
            alt="GymPilot"
            className={cn('object-contain rounded-xl', className)}
            {...props}
        />
    );
}
