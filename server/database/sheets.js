function sheetToJson(nombreHoja) {
	const libro = SpreadsheetApp.getActiveSpreadsheet();
	const hoja = nombreHoja ? libro.getSheetByName(nombreHoja) : libro.getActiveSheet();

	if (!hoja) {
		throw new Error(`La hoja "${nombreHoja}" no fue encontrada.`);
	}

	const rangoDatos = hoja.getDataRange();
	const valores = rangoDatos.getValues();

	if (valores.length < 2) {
		return [];
	}

	const encabezados = valores[0].map(h => String(h).trim());
	const arrayJson = [];

	for (let i = 1; i < valores.length; i++) {
		const fila = valores[i];
		const objetoJson = {};

		for (let j = 0; j < encabezados.length; j++) {
			const encabezado = encabezados[j];
			const valor = fila[j];

			if (encabezado) {
				objetoJson[encabezado] = valor;
			}
		}
		// @ts-ignore
		arrayJson.push(objetoJson);
	}

	return JSON.stringify(arrayJson);
}

/**
 * Realiza un "upsert" (actualizar o insertar) de filas en una hoja de Google Sheets de forma altamente optimizada.
 * Minimiza las llamadas a la API para un rendimiento máximo.
 *
 * @param {Array<Object>|Array<Array<any>>} rows - Un array de objetos (con claves que coinciden con los encabezados) o un array de arrays para ser insertados/actualizados.
 * @param {string|string[]} keyColumns - El nombre o nombres de las columnas que actúan como clave única para identificar las filas.
 * @param {object} [options={}] - Opciones de configuración.
 * @param {string} [options.sheetName] - El nombre de la hoja. Si se omite, se usa la primera hoja activa.
 * @param {number} [options.headersRow=1] - El número de la fila donde se encuentran los encabezados.
 * @param {boolean} [options.normalizeKey=true] - Si es true, convierte las claves a minúsculas y sin espacios extra para la comparación.
 * @param {'merge'|'replace'} [options.upsertMode='merge'] - 'merge': actualiza solo las columnas con valor. 'replace': reemplaza la fila completa.
 * @param {boolean} [options.ignoreIfSame=true] - Si es true, no realiza la escritura si la fila nueva es idéntica a la existente.
 *
 * @returns {{updated: number, inserted: number, skipped: number, errors: Array<{rowIndex: number, message: string}>, updatedRowIndexes: Array<number>}}
 * Un objeto con el recuento de filas actualizadas, insertadas, omitidas, errores y los índices de las filas actualizadas.
 */
function upsertRows(rows, keyColumns, options = {}) {
	const lock = LockService.getScriptLock();
	if (!lock.tryLock(10000)) {
		throw new Error('No se pudo obtener el bloqueo del script. Inténtalo de nuevo más tarde.');
	}

	try {
		const ss = SpreadsheetApp.getActiveSpreadsheet();
		const sheet = options.sheetName ? ss.getSheetByName(options.sheetName) : ss.getSheets()[0];
		if (!sheet) throw new Error(`Hoja no encontrada: ${options.sheetName}`);

		// --- 1. CONFIGURACIÓN Y LECTURA INICIAL (OPTIMIZADO) ---
		const headersRow = options.headersRow || 1;
		const normalizeKey = options.normalizeKey !== false;
		const upsertMode = options.upsertMode || 'merge';
		const ignoreIfSame = options.ignoreIfSame !== false;

		const dataRange = sheet.getDataRange();
		const allValues = dataRange.getValues();

		const headers = allValues[headersRow - 1] || [];
		if (headers.length === 0) throw new Error('No se encontraron encabezados en la fila especificada.');

		const headerIndex = new Map(headers.map((h, i) => [String(h || '').trim(), i]));

		const keyColIndexes = (Array.isArray(keyColumns) ? keyColumns : [keyColumns]).map(k => {
			const index = headerIndex.get(k);
			if (index === undefined) throw new Error(`La columna clave "${k}" no se encuentra en los encabezados.`);
			return index;
		});

		const dataStartRow = headersRow + 1;
		const existingValues = allValues.length >= dataStartRow ? allValues.slice(headersRow) : [];

		// --- 2. HELPERS Y MAPEO DE CLAVES EXISTENTES (RÁPIDO) ---
		const makeKey = rowArr => {
			let key = keyColIndexes
				.map(idx => {
					const raw = rowArr[idx];
					return raw === null || raw === undefined ? '' : String(raw);
				})
				.join('||');
			return normalizeKey ? key.trim().toLowerCase() : key;
		};

		const rowToArray = input => {
			const out = new Array(headers.length).fill('');
			if (Array.isArray(input)) {
				for (let i = 0; i < Math.min(input.length, headers.length); i++) out[i] = input[i];
			} else {
				for (const [key, value] of Object.entries(input)) {
					if (headerIndex.has(key)) {
						out[headerIndex.get(key)] = value;
					}
				}
			}
			return out;
		};

		const arraysAreEqual = (a, b) => {
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (String(a[i] ?? '') !== String(b[i] ?? '')) return false;
			}
			return true;
		};

		// Crear un mapa de `clave -> índice` para búsquedas O(1)
		const existingKeyToIdx = new Map();
		for (let i = 0; i < existingValues.length; i++) {
			const key = makeKey(existingValues[i]);
			if (key) existingKeyToIdx.set(key, i);
		}

		// --- 3. PROCESAMIENTO EN MEMORIA (CLASIFICAR PARA INSERT/UPDATE) ---
		const toInsert = [];
		const updatedExisting = existingValues.map(row => [...row]); // Clon profundo para mutar
		const changedIndices = new Set();
		const stats = { updated: 0, inserted: 0, skipped: 0, errors: [] };

		for (let i = 0; i < rows.length; i++) {
			try {
				const newRowArr = rowToArray(rows[i]);
				const key = makeKey(newRowArr);
				const existingIdx = key ? existingKeyToIdx.get(key) : undefined;

				if (existingIdx === undefined) {
					toInsert.push(newRowArr);
					stats.inserted++;
				} else {
					const existingRow = updatedExisting[existingIdx];

					if (upsertMode === 'replace') {
						if (ignoreIfSame && arraysAreEqual(newRowArr, existingRow)) {
							stats.skipped++;
							continue;
						}
						updatedExisting[existingIdx] = newRowArr;
					} else {
						// merge
						let hasChanged = false;
						for (let c = 0; c < headers.length; c++) {
							const newVal = newRowArr[c];
							if (newVal !== undefined && newVal !== null && newVal !== '') {
								if (String(existingRow[c] ?? '') !== String(newVal)) {
									existingRow[c] = newVal; // Modificar directamente
									hasChanged = true;
								}
							}
						}
						if (!hasChanged && ignoreIfSame) {
							stats.skipped++;
							continue;
						}
					}
					changedIndices.add(existingIdx);
					stats.updated++;
				}
			} catch (e) {
				stats.errors.push({ rowIndex: i, message: String(e) });
			}
		}

		// --- 4. ESCRITURA EN HOJA (MINIMIZANDO LLAMADAS A LA API) ---

		// A. Escribir todas las actualizaciones. Agrupa índices contiguos para escrituras más grandes.
		if (changedIndices.size > 0) {
			const sortedIndices = Array.from(changedIndices).sort((a, b) => a - b);
			let startIdx = sortedIndices[0];
			let endIdx = sortedIndices[0];

			const writeBatch = (start, end) => {
				const range = sheet.getRange(dataStartRow + start, 1, end - start + 1, headers.length);
				const valuesToWrite = updatedExisting.slice(start, end + 1);
				range.setValues(valuesToWrite);
			};

			for (let i = 1; i < sortedIndices.length; i++) {
				if (sortedIndices[i] === endIdx + 1) {
					endIdx = sortedIndices[i];
				} else {
					writeBatch(startIdx, endIdx);
					startIdx = endIdx = sortedIndices[i];
				}
			}
			writeBatch(startIdx, endIdx); // Escribir el último lote
		}

		// B. Escribir todas las inserciones en una sola operación (MUCHO MÁS RÁPIDO).
		if (toInsert.length > 0) {
			const lastRow = Math.max(headersRow, sheet.getLastRow());
			sheet.getRange(lastRow + 1, 1, toInsert.length, headers.length).setValues(toInsert);
		}

		return {
			...stats,
			updatedRowIndexes: Array.from(changedIndices)
				.sort((a, b) => a - b)
				.map(i => dataStartRow + i),
		};
	} finally {
		lock.releaseLock();
	}
}
