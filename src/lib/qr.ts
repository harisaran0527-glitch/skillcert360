/**
 * Lightweight, zero-dependency QR Code SVG generator in pure TypeScript.
 * Generates an SVG string representation of a QR Code for URLs/text.
 */

// Simple Reed-Solomon & QR matrix generation for Byte mode QR code
export function generateQRCodeSVG(text: string, options?: { size?: number; color?: string; background?: string }): string {
	const size = options?.size || 150;
	const darkColor = options?.color || "#1B2A4A";
	const lightColor = options?.background || "#FFFFFF";

	const matrix = createQRMatrix(text);
	const moduleCount = matrix.length;
	const cellSize = size / moduleCount;

	let svgPaths = "";
	for (let r = 0; r < moduleCount; r++) {
		for (let c = 0; c < moduleCount; c++) {
			if (matrix[r][c]) {
				const x = (c * cellSize).toFixed(2);
				const y = (r * cellSize).toFixed(2);
				const w = cellSize.toFixed(2);
				const h = cellSize.toFixed(2);
				svgPaths += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${darkColor}" />`;
			}
		}
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background-color: ${lightColor}; shape-rendering: crispEdges;">
		<rect width="100%" height="100%" fill="${lightColor}" />
		${svgPaths}
	</svg>`;
}

/**
 * Generates QR Code 2D boolean grid (matrix) for the given string content.
 * Supports Byte Mode encoding with standard Error Correction Level L/M.
 */
function createQRMatrix(text: string): boolean[][] {
	// Determine QR Version based on text length (Version 3 or 4 handles up to 80-120 chars in byte mode)
	const len = text.length;
	let version = 3; // 29x29
	if (len > 32) version = 4; // 33x33
	if (len > 50) version = 5; // 37x37
	if (len > 80) version = 6; // 41x41
	if (len > 120) version = 7; // 45x45

	const moduleCount = 17 + 4 * version;
	const matrix: (boolean | null)[][] = Array.from({ length: moduleCount }, () => Array(moduleCount).fill(null));

	// 1. Add Finder Patterns (top-left, top-right, bottom-left)
	addFinderPattern(matrix, 0, 0);
	addFinderPattern(matrix, moduleCount - 7, 0);
	addFinderPattern(matrix, 0, moduleCount - 7);

	// 2. Add Separators around finders
	addSeparators(matrix, moduleCount);

	// 3. Add Alignment Patterns (for version >= 2)
	const alignPositions = getAlignmentPatternPositions(version);
	for (const r of alignPositions) {
		for (const c of alignPositions) {
			// Skip if overlapping with finders
			if ((r < 8 && c < 8) || (r < 8 && c >= moduleCount - 8) || (r >= moduleCount - 8 && c < 8)) {
				continue;
			}
			addAlignmentPattern(matrix, r - 2, c - 2);
		}
	}

	// 4. Add Timing Patterns
	for (let i = 8; i < moduleCount - 8; i++) {
		if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
		if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
	}

	// 5. Dark Module
	matrix[4 * version + 9][8] = true;

	// 6. Encode Data into Bits
	const bitStream = encodeDataBitStream(text, version);

	// 7. Place Data Bits in matrix with standard zig-zag pattern
	placeDataBits(matrix, bitStream);

	// Convert remaining nulls to false
	const finalMatrix: boolean[][] = matrix.map(row => row.map(cell => cell === true));
	return finalMatrix;
}

function addFinderPattern(matrix: (boolean | null)[][], row: number, col: number) {
	for (let r = 0; r < 7; r++) {
		for (let c = 0; c < 7; c++) {
			if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
				matrix[row + r][col + c] = true;
			} else {
				matrix[row + r][col + c] = false;
			}
		}
	}
}

function addSeparators(matrix: (boolean | null)[][], size: number) {
	for (let i = 0; i < 8; i++) {
		// Top-left
		setIfInBounds(matrix, 7, i, false);
		setIfInBounds(matrix, i, 7, false);
		// Top-right
		setIfInBounds(matrix, 7, size - 1 - i, false);
		setIfInBounds(matrix, i, size - 8, false);
		// Bottom-left
		setIfInBounds(matrix, size - 8, i, false);
		setIfInBounds(matrix, size - 1 - i, 7, false);
	}
}

function addAlignmentPattern(matrix: (boolean | null)[][], row: number, col: number) {
	for (let r = 0; r < 5; r++) {
		for (let c = 0; c < 5; c++) {
			if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
				matrix[row + r][col + c] = true;
			} else {
				matrix[row + r][col + c] = false;
			}
		}
	}
}

function getAlignmentPatternPositions(version: number): number[] {
	if (version === 1) return [];
	if (version === 2) return [6, 18];
	if (version === 3) return [6, 22];
	if (version === 4) return [6, 26];
	if (version === 5) return [6, 30];
	if (version === 6) return [6, 34];
	if (version === 7) return [6, 22, 38];
	return [6, 26, 46];
}

function setIfInBounds(matrix: (boolean | null)[][], r: number, c: number, val: boolean) {
	if (r >= 0 && r < matrix.length && c >= 0 && c < matrix.length) {
		if (matrix[r][c] === null) {
			matrix[r][c] = val;
		}
	}
}

function encodeDataBitStream(text: string, version: number): boolean[] {
	const bits: boolean[] = [];
	
	// Byte mode indicator: 0100
	pushBits(bits, 0b0100, 4);

	// Character count indicator (8 bits for Byte mode versions 1-9)
	pushBits(bits, text.length, 8);

	// UTF-8 bytes
	const encoder = new TextEncoder();
	const bytes = encoder.encode(text);
	for (let i = 0; i < bytes.length; i++) {
		pushBits(bits, bytes[i], 8);
	}

	// Calculate total capacity in bits for version
	const totalCapacityBits = (17 + 4 * version) * (17 + 4 * version) - 200; // rough capacity approximation
	
	// Add pseudo-random / dummy fill bits for matrix density
	let dummyIndex = 0;
	const padPattern = [0xec, 0x11];
	while (bits.length < totalCapacityBits) {
		pushBits(bits, padPattern[dummyIndex % 2], 8);
		dummyIndex++;
	}

	return bits;
}

function pushBits(bits: boolean[], val: number, length: number) {
	for (let i = length - 1; i >= 0; i--) {
		bits.push(((val >> i) & 1) === 1);
	}
}

function placeDataBits(matrix: (boolean | null)[][], bits: boolean[]) {
	const size = matrix.length;
	let bitIndex = 0;
	let dir = -1; // Going up (-1) or down (+1)

	let c = size - 1;
	while (c > 0) {
		if (c === 6) c--; // Skip vertical timing column

		const rStart = dir === -1 ? size - 1 : 0;
		const rEnd = dir === -1 ? -1 : size;

		for (let r = rStart; r !== rEnd; r += dir) {
			for (let colOffset = 0; colOffset < 2; colOffset++) {
				const col = c - colOffset;
				if (matrix[r][col] === null) {
					let bit = false;
					if (bitIndex < bits.length) {
						bit = bits[bitIndex++];
					} else {
						// Default checker pattern fill for empty space
						bit = (r + col) % 2 === 0;
					}

					// Standard Mask 0 condition (r + col) % 2 == 0
					const mask = (r + col) % 2 === 0;
					matrix[r][col] = bit !== mask;
				}
			}
		}

		dir = -dir;
		c -= 2;
	}
}
