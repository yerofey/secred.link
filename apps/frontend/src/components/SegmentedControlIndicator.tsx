import { useMediaQuery } from '@/hooks/use-media-query';
import type { SlidingSegmentRect } from '@/hooks/use-sliding-segment-indicator';
import { cn } from '@/lib/utils';

export function SegmentedControlIndicator({
	indicator,
	indicatorReady,
	className,
}: {
	indicator: SlidingSegmentRect | null;
	indicatorReady: boolean;
	className?: string;
}) {
	const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

	return (
		<span
			aria-hidden
			className={cn(
				'segmented-control__indicator',
				indicatorReady && 'segmented-control__indicator--ready',
				reduceMotion && 'segmented-control__indicator--instant',
				className,
			)}
			style={
				indicatorReady && indicator
					? {
							width: indicator.width,
							transform: `translateX(${indicator.x}px)`,
						}
					: undefined
			}
		/>
	);
}
