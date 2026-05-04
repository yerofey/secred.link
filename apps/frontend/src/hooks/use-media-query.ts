import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(() =>
		typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
	);

	useEffect(() => {
		const mq = window.matchMedia(query);
		const sync = () => setMatches(mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	}, [query]);

	return matches;
}
