import * as THREE from "three";


/** Defines a canvas-generated text. */
export declare class Text extends THREE.Mesh {

	/** The global list of texts. */
	static list: Record<string, Font>;

	/** The (CSS) color of the text. */
	static color: string;

	/** Identifies the instance as text. */
	readonly isText: boolean;

	/** The character string of the text. */
	string: string;

	/** The character string of the text. */
	font: Font;

	/** The font style. */
	fontStyle: string;

	/** The size of each line of the text. */
	lineSize: number;

	/** The size of the geometry grid of the text. */
	gridSize: number;

	/** The string data of the text. */
	material: THREE.MeshBasicMaterial;

	/** The (CSS) color of the text. */
	color: string;

	/** The alignment of the text. */
	align: string;

	/** The location of the origin of the geometry of the text. */
	anchor: string;

	/** The type of backface of the text (none, normal, or mirrored). */
	backface: string;

	/** The padding (in percentage) around the text. */
	padding: number;

	/** The margin (in percentage) around the text. */
	margin: number;

	/** The canvas element where the text is rendered. */
	canvas: HTMLCanvasElement;

	/** Activates the debug mode. */
	debug: boolean;


	/** Initializes a new instance of the Text class.
	 * @param {object} data The data of the text.
	 * @param {string} data.name The name of the text.
	 * @param {string} data.string The character string of the text.
	 * @param {string} data.font The name of the font of the text.
	 * @param {object} data.font The font of the text.
	 * @param {number} data.lineSize The size of each line of the text.
	 * @param {string} data.color The (CSS) color of the text.
	 * @param {number} data.padding The padding (in pixels) around the text.
	 * @param {object} data.canvas The canvas element where the text is rendered.
	 * @param {boolean} data.debug Activates the debug mode. */
	constructor(data?: any);


	/** Updates the Text instance. */
	update(): void;
}




/** Defines a typographic font */
export declare class Font {

	/** The global list of fonts. */
	static list: Record<string, Font>;

	/** Identifies the instance as a font. */
	readonly isFont: boolean;

	/** The name of the font. */
	name: string;

	/** The family of the font. */
	family: string;

	/** The path for external font files. */
	files: object[];

	/** The path for external font file. */
	texts: Text[];

	/** Indicates whether the font is loaded or not. */
	loaded: boolean;

	/** The resolution (in pixels) of each line of text. */
	resolution: number;

	/** Activates the debug mode. */
	debug: boolean;


	/** Initializes a new instance of the Font class.
	 * @param {object} data The data of the font.
	 * @param {string} data.name The name of the font.
	 * @param {boolean} data.debug Activates the debug mode. */
	constructor(data?: any | string);

	/** Obtains the string representing the  */
	toString(): string;


	/** Creates a list of Unicode characters. Useful for debugging.
	 * @param minValue The minimum Unicode value.
	 * @param maxValue The maximum Unicode value.
	 * @return A string with the different characters. */
	static createCharacters(minValue?: number, maxValue?: number): string;


	/** Checks if a font family is currently installed in the system.
	 * @param fontFamily The name of the font family to check.
	 * @param context The canvas context where to perform the check.
	 * @return A string with the different characters. */
	static isAvailable(fontFamily: string, context?: CanvasRenderingContext2D): boolean;
}

