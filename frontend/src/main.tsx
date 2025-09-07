import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { Data } from './Data.tsx';
import { Layout } from './layout.tsx';

const router = createHashRouter([
	{
		path: '/',
		element: <Layout />,
		children: [
			{
				index: true,
				element: <App />,
			},
			{
				path: 'dataset',
				element: <Data />,
			},
		],
	},
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
