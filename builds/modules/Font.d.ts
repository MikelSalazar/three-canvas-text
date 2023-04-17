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
    static createCharacters(minValue?: number, maxValue?: number): string;
    static isAvailable(fontFamily: string, context?: CanvasRenderingContext2D): boolean;
}
