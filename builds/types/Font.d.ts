import { Text } from "./Text";

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
