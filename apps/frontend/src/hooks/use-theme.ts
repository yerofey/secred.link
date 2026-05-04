import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
	const saved = localStorage.getItem('theme');
	if (saved === 'light' || saved === 'dark') {
		return saved;
	}
	return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useTheme = () => {
	const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

	useEffect(() => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', theme === 'dark' ? '#171b20' : '#f7f5ef');
		localStorage.setItem('theme', theme);
	}, [theme]);

	return { theme, setTheme };
};
