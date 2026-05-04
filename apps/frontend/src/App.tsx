import {
	createBrowserRouter,
	Navigate,
	RouterProvider,
} from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { I18nProvider } from '@/lib/i18n';
import { lazyPage } from '@/lib/lazy-page';

const Home = lazyPage(() => import('@/pages/Home'), 'Home');
const ManageSecret = lazyPage(
	() => import('@/pages/ManageSecret'),
	'ManageSecret',
);
const Storage = lazyPage(() => import('@/pages/Storage'), 'Storage');
const ViewSecret = lazyPage(() => import('@/pages/ViewSecret'), 'ViewSecret');

const router = createBrowserRouter([
	{
		path: '/',
		element: <Layout />,
		children: [
			{ index: true, element: <Home /> },
			{ path: 'new', element: <Navigate to="/manage" replace /> },
			{ path: 'manage', element: <ManageSecret /> },
			{ path: 'storage', element: <Storage /> },
			{ path: 'view', element: <ViewSecret /> },
		],
	},
]);

export function App() {
	return (
		<I18nProvider>
			<RouterProvider router={router} />
		</I18nProvider>
	);
}
