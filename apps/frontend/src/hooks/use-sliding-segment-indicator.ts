import { useLayoutEffect, useRef, useState } from 'react';

export type SlidingSegmentRect = {
	width: number;
	x: number;
};

export function useSlidingSegmentIndicator(selectedIndex: number) {
	const groupRef = useRef<HTMLDivElement>(null);
	const segmentRefs = useRef<Array<HTMLElement | null>>([]);
	const [indicator, setIndicator] = useState<SlidingSegmentRect | null>(null);

	useLayoutEffect(() => {
		const group = groupRef.current;
		const segment = segmentRefs.current[selectedIndex];
		if (!group || !segment) {
			return;
		}

		const measure = () => {
			const groupRect = group.getBoundingClientRect();
			const segmentRect = segment.getBoundingClientRect();
			setIndicator({
				width: segmentRect.width,
				x: segmentRect.left - groupRect.left,
			});
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(group);
		for (const element of segmentRefs.current) {
			if (element) {
				observer.observe(element);
			}
		}
		return () => observer.disconnect();
	}, [selectedIndex]);

	const indicatorReady = indicator !== null && indicator.width > 0;

	return {
		groupRef,
		segmentRefs,
		indicator,
		indicatorReady,
	};
}
