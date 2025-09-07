import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
// esquema de validación
const FormSchema = z.object({
	id: z.string().min(1, { message: 'Required' }),
	header: z.string().min(2, { message: 'Required' }),
	type: z.string().min(1, { message: 'Required' }),
	status: z.enum(['In Process', 'Done', 'Pending']),
	target: z.string().regex(/^\d+$/, { message: 'Must be a number' }),
	limit: z.string().regex(/^\d+$/, { message: 'Must be a number' }),
	reviewer: z.string().min(2, { message: 'Required' }),
});

export const NewItem = () => {
	const [loading, setLoading] = useState(false);
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			id: '',
			header: '',
			type: '',
			status: 'Pending',
			target: '',
			limit: '',
			reviewer: '',
		},
	});

	function onSubmit(data: z.infer<typeof FormSchema>) {
		setLoading(true);
		toast('Submitted values', {
			description: (
				<pre className='mt-2 w-[320px] rounded-md bg-neutral-950 p-4'>
					<code className='text-white'>{JSON.stringify(data, null, 2)}</code>
				</pre>
			),
		});
		console.log(data);
		google.script.run
			.withSuccessHandler((msg: string) => {
				setLoading(false);
				console.log(msg);
			})
			.withFailureHandler(error => {
				setLoading(false);
				console.error(error);
			})
			.upsertRows([data], 'id', {
				sheetName: 'dataset',
				upsertMode: 'replace',
			});
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='outline' size='sm'>
					<IconPlus />
					<span className='hidden lg:inline'>Add Section</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add data</DialogTitle>
					<DialogDescription>Agrega informacion a la tabla</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 w-2/3'>
						<FormField
							control={form.control}
							name='id'
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID</FormLabel>
									<FormControl>
										<Input placeholder='1' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='header'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Header</FormLabel>
									<FormControl>
										<Input placeholder='Cover page' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='type'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Type</FormLabel>
									<FormControl>
										<Input placeholder='Cover page / Table of contents' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='status'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder='Select status' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value='In Process'>In Process</SelectItem>
											<SelectItem value='Done'>Done</SelectItem>
											<SelectItem value='Pending'>Pending</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='target'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Target</FormLabel>
									<FormControl>
										<Input placeholder='18' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='limit'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Limit</FormLabel>
									<FormControl>
										<Input placeholder='24' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='reviewer'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reviewer</FormLabel>
									<FormControl>
										<Input placeholder='Eddie Lake' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type='submit'>{loading && <Loader2Icon className='animate-spin' />} Guardar</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
