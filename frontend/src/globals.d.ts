// globals.d.ts

// Primero, definimos una interfaz con las funciones que existen en tu Code.gs
// ¡Aquí es donde agregas tus propias funciones para obtener autocompletado!
interface ServerFunctions {
	helloWorld(): void; // La función de tu imagen
	sheetToJson(nombreHoja: string): string;
	upsertRows(
		rows: any[],
		keyColumns: string | string[],
		options?: {
			sheetName?: string;
			headersRow?: number;
			upsertMode?: 'merge' | 'replace';
			batchSize?: number;
			ignoreIfSame?: boolean;
		},
	): any;
}

// Ahora, declaramos el objeto global 'google' para que TypeScript lo conozca
declare namespace google {
	namespace script {
		interface Runner extends ServerFunctions {
			withSuccessHandler(callback: (result: any, object?: any) => void): Runner;
			withFailureHandler(callback: (error: Error, object?: any) => void): Runner;
			withUserObject(object: any): Runner;
		}
		const run: Runner;
	}
}
