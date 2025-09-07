import { useEffect, useState } from 'react';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import { SectionCards } from '@/components/section-cards';
import { SiteHeader } from '@/components/site-header';
import { Skeleton } from './components/ui/skeleton';

function DataTableSkeleton() {
	return (
		<div className='w-full space-y-4 px-4 lg:px-6'>
			{/* Table Body */}
			<div className='rounded-md border'>
				{/* Header row skeleton */}
				<div className='flex items-center border-b p-4'>
					<Skeleton className='h-6 w-1/4' />
					<Skeleton className='ml-4 h-6 w-1/4' />
					<Skeleton className='ml-4 h-6 w-1/4' />
					<Skeleton className='ml-4 h-6 w-1/4' />
				</div>
				{/* Data rows skeleton */}
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className='flex items-center border-b p-4'>
						<Skeleton className='h-6 w-1/4' />
						<Skeleton className='ml-4 h-6 w-1/4' />
						<Skeleton className='ml-4 h-6 w-1/4' />
						<Skeleton className='ml-4 h-6 w-1/4' />
					</div>
				))}
			</div>
		</div>
	);
}

export const Data = () => {
	const [data, setData] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		if (window.google !== undefined) {
			google.script.run
				.withSuccessHandler((msg: string) => {
					console.log(msg);
					setData(JSON.parse(msg));
					setIsLoading(false);
				})
				.withFailureHandler(msg => {
					console.log(msg);
					setIsLoading(false);
				})
				.sheetToJson('dataset');
		}
	}, []);
	return (
		<div>
			<SiteHeader />
			<div className='flex flex-1 flex-col'>
				<div className='@container/main flex flex-1 flex-col gap-2'>
					<div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
						<SectionCards />
						<div className='px-4 lg:px-6'>
							<ChartAreaInteractive />
						</div>
						{isLoading ? <DataTableSkeleton /> : <DataTable data={data} />}
					</div>
				</div>
			</div>
		</div>
	);
};
