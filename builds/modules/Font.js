
/** Defines a typographic font */ 
export class Font {
	
	
	/** Initializes a new instance of the Font class.
	 * @param {object} data The data of the font.
	 * @param {string} data.name The name of the font.
	 * @param {boolean} data.debug Activates the debug mode. */ 
	constructor(data = {}) {
	
		// Identify the instance as font
		this.isFont = true; 
	
		// First, check if we are in debug mode
		this.debug = data.debug == true; 
	
		// Check the given data
		if (typeof data == 'string') data = { family: data }; 
	
		// Get the font name
		this.name = data.name || data.family || 'Font' + 
			Object.keys(Font.list).length; 
	
		// Get the font family
		this.family = data.family || 'sans-serif'; 
	
		// Get the font name (family name and style)
		this.resolution = data.resolution || 256; //* devicePixelRatio;
	
		// Initialize the lists of texts
		this.texts = []; 
	
		// Get the files of the font
		this.files = []; 
		if (data.files) { 
			let sourcesString = ''; 
			if (!Array.isArray(data.files)) data.files = [data.files]; 
			for (let file of data.files) { 
				if (typeof file == 'string') file = { path: file }; 
				if (!file.path) throw Error('Invalid font file path'); 
				if (sourcesString.length != 0) sourcesString += ','; 
				sourcesString += ' url(' + file.path + ')' + 
					(file.style ? (' ' + file.style) : ''); 
			} 
	
			console.log(sourcesString); 
			let fontFace = new FontFace(this.family, sourcesString); 
			document.fonts.add(fontFace); 
			fontFace.load().then((fontData) => {
				this.family = fontData.family; 
				console.log(this.family + ' loaded'); 
				this.loaded = true; 
				for (let text of this.texts) text.update(); 
			}); 
			this.loaded = false; 
		} else this.loaded = true; 
	
		// Add this instance to the global list
		Font.list[this.name] = this; 
	
		// Show a message on console
		console.log('Font created: ' + this.name); 
	} 
	
	/** Obtains the string representing the  */ 
	toString() { return this.resolution + 'px ' + this.family; } 
	
	
	/** Creates a list of Unicode characters. Useful for debugging.
	 * @param minValue The minimum Unicode value.
	 * @param maxValue The maximum Unicode value.
	 * @return A string with the different characters. */ 
	static createCharacters(minValue = 65, maxValue = 120) {
		let vs = []; for (let v = minValue; v <= maxValue; v++) vs.push(v); 
		return String.fromCharCode(...vs); 
	} 
	
	
	/** Checks if a font family is currently installed in the system.
	 * @param fontFamily The name of the font family to check.
	 * @param context The canvas context where to perform the check.
	 * @return A string with the different characters. */ 
	static isAvailable(fontFamily, context) {
	
		// Use the general solution for most browsers (Chromium and Safari)
		if (!document.fonts.check('72px ' + fontFamily)) return false; 
	
		// HACK If the previous system doesn't confirm it, use a test text
		let defaultFonts = ['arial', 'times new roman', 'courier new']; 
		if (defaultFonts.includes(fontFamily)) return true; 
		let testFonts = ['sans-serif', 'serif', 'monospace']; 
		if (testFonts.includes(fontFamily)) return true; 
		let testText = Font.createCharacters(); 
		for (let testFont of testFonts) { 
			context.font = '72px ' + fontFamily + ', ' + testFont; 
			let w1 = context.measureText(testText).width; 
			context.font = '72px ' + testFont; 
			let w2 = context.measureText(testText).width; 
			if (w1 == w2) return false; 
		} 
	
		// After those checks, assume the font family is installed
		return true; 
	} 
} 

	/** The global list of fonts. */ 
	Font.list = {}; 
