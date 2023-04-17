import * as THREE from "three";
import { Font } from "./Font";

/** Defines a canvas-generated text. */
export class Text extends THREE.Mesh {

	/** The global list of texts. */
	static list: Record<string, Font>

	/** The (CSS) color of the text. */
	static color: string = 'white';
	
	/** Identifies the instance as text. */
	public readonly isText: boolean

	/** The character string of the text. */
	public string: string;

	/** The character string of the text. */
	public font: Font;

	/** The font style. */
	public fontStyle: string;

	/** The size of each line of the text. */
	public lineSize: number;

	/** The size of the geometry grid of the text. */
	public gridSize: number;

	/** The string data of the text. */
	public material: THREE.MeshBasicMaterial;

	/** The (CSS) color of the text. */
	public color: string;

	/** The alignment of the text. */
	public align: string;

	/** The location of the origin of the geometry of the text. */
	public anchor: string;

	/** The type of backface of the text (none, normal, or mirrored). */
	public backface: string;

	/** The padding (in percentage) around the text. */
	public padding: number;

	/** The margin (in percentage) around the text. */
	public margin: number;

	/** The canvas element where the text is rendered. */
	public canvas: HTMLCanvasElement;

	/** Activates the debug mode. */
	public debug: boolean;


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
	constructor(data: any = {}) {

		// Call the base class constructor
		super();

		// Identify the instance as text
		this.isText = true;

		// First, check if we are in debug mode
		this.debug = data.debug == true;

		// Check the given data
		if (typeof data == 'string') data = { string: data };

		// Get the text name
		this.name = data.name || 'Text';
	
		// Get the character string
		this.string = data.string || '<Text>';

		// Get the font of the text
		if (data.font != undefined) {
			if ((typeof data.font == 'string')) {
				this.font = (Font.list[data.font])? Font.list[data.font] :
					new Font({family: data.font});
			} else {
				if ((typeof data.font == 'object'))
					this.font = (data.font.isFont)?  data.font : 
						new Font({family: data.font});
				else throw Error ('Invalid font value for text')
			}
		} else this.font = new Font();
		this.font.texts.push(this);

		// Get the font style
		this.fontStyle = data.fontStyle || '';

		// Get the size of the lines
		this.lineSize = data.lineSize || 1;

		// Get the size of the grid
		this.gridSize = data.gridSize || 1;

		// Get the text color
		this.color = data.color;

		// Get the text alignment
		this.align = data.align || 'center';

		// Get the text anchor
		this.anchor = data.anchor || '';

		// Get the text backface
		this.backface = data.backface || 'none';

		// Get the text padding
		this.padding = (data.padding != undefined)? data.padding : 0;
		
		// Get the text margin
		this.margin = (data.margin != undefined)? data.margin : 0;

		// Set the canvas element 
		if (!data.canvas) {
			this.canvas = document.createElement('canvas'); 
			// document.body.append(this.canvas); 
			// this.canvas.style.cssText = "position:fixed; top: 0; right: 0;"; 
		} else this.canvas = data.canvas;

		// Create the initial geometry
		this.geometry = new THREE.BufferGeometry();

		// Create the material
		this.material = new THREE.MeshBasicMaterial({ transparent: true });

		// Update the Text instance
		this.update();
	}


	/** Updates the Text instance. */
	update() {

		// Create the CSS font string
		let cssFontText = this.fontStyle + ' ' + this.font.toString(); 

		// Get the context of the canvas
		let context = this.canvas.getContext('2d');
		if (!context) throw ("Invalid context");

		// Calculate the size of the text, line by line
		context.font = cssFontText;
		let width = 0, height = 0, lines = this.string.split('\n'), 
			lineCount = lines.length;
		for (let lineIndex = 0; lineIndex <lineCount; lineIndex++) {
			let lineMeasurement = context.measureText(lines[lineIndex]), 
				lineWidth = Math.abs(lineMeasurement.actualBoundingBoxLeft) + 
					Math.abs(lineMeasurement.actualBoundingBoxRight);
			if (width < lineWidth) width = lineWidth;
			if (width < lineMeasurement.width) width = lineMeasurement.width;
		}
		
		// HACK Use a block character (&block;)to obtain the line height
		let lineMeasurement = context.measureText('█');
		let lineHeight = Math.abs(lineMeasurement.actualBoundingBoxAscent) + 
			Math.abs(lineMeasurement.actualBoundingBoxDescent);
		if (height < lineHeight * lineCount) height = lineHeight * lineCount;
		
		// Add the padding to the text
		let scale = 0;
		if (this.padding > 0) {
			let doublePadding = this.padding * lineHeight * 2; 
			width += doublePadding; height += doublePadding;
			scale += this.padding; 
		} else this.padding = 0;

		// Add the margin to the text
		if (this.margin > 0) {
			let doubleMargin = this.margin * lineHeight * 2; 
			width += doubleMargin; height += doubleMargin; scale += this.margin; 
		} else this.margin = 0;

		// Adjust the width and height
		width = Math.ceil(width); height = Math.ceil(height);
		let aspect = width / height;

		// Update the size of the canvas element
		if (this.canvas.width != width) this.canvas.width = width; 
		if (this.canvas.height != height) this.canvas.height = height;

		// Clear the canvas
		context.clearRect(0, 0, width, height);
		
		// Render the text
		context.font = cssFontText; 
		context.fillStyle = this.color || Text.color;
		let translateX = 0;
		switch (this.align) {
			case 'left': translateX = 0; context.textAlign = 'left'; break
			case 'center': translateX = width/2; context.textAlign = 'center'; break
			case 'right': translateX = width; context.textAlign = 'right'; break
		}
		context.textBaseline = 'bottom';
		for (let lineIndex = 0; lineIndex <lineCount; lineIndex++)
			context.fillText(lines[lineIndex], translateX, 
				lineHeight * (scale + lineIndex + 1));

		// Update the (transparent) texture
		this.material.map = new THREE.CanvasTexture(this.canvas);
		this.material.needsUpdate = true;

		// Convert width and height to virtual units using the lineSize value
		let size = this.lineSize * (lineCount + this.margin * 2);
		width = aspect * size; height = size;

		// Define the grid
		let gridX = Math.floor(width / this.gridSize), gridX1 = gridX + 1,
			gridY = Math.floor(height / this.gridSize), gridY1 = gridY + 1
		
		let segmentWidth = width / gridX, segmentHeight = height / gridY,
			halfWidth = width / 2, halfHeight = height / 2;

		// Update the geometry
		let vertices:number[] = [], normals:number[] = [], 
			uvs:number[] = [], faces:number[] = [];

		// Create the front side
		for (let iy = 0; iy < gridY1; iy++) {
			let y = iy * segmentHeight - halfHeight;
			for (let ix = 0; ix < gridX1; ix++) {
				let x = ix * segmentWidth - halfWidth;
				vertices.push(x, -y, 0); normals.push(0, 0, 1);
				uvs.push(ix/gridX, 1 - (iy/gridY));
				if (ix == gridX || iy == gridY) continue;
				let a = ix + gridX1 * iy, b = ix + gridX1 * ( iy + 1 ),
				c = (ix + 1) + gridX1 * (iy + 1), d = (ix + 1) + gridX1 * iy;
				faces.push(a, b, d); faces.push(b, c, d);
			}
		}

		// Create the back faces (if required)
		let verticesDataSize = vertices.length, uvsDataSize = uvs.length,
			normalsDataSize = normals.length, faceDataSize = faces.length;
		let vertexCount = verticesDataSize /3, triangleCount = faceDataSize / 3;
		switch (this.backface) {
			case 'normal': // Just create new faces with the indices inverted
				for (let f = 0; f < faceDataSize; f += 3)
					faces.push(faces[f], faces[f+2], faces[f+1]);
					vertexCount *= 2, triangleCount *= 2;
				break;
			case 'mirrored': // Copy the data
				for (let v = 0; v < verticesDataSize; v += 3)
					vertices.push(-vertices[v], vertices[v+1], vertices[v+2]);
				for (let n = 0; n < normalsDataSize; n += 3)
					normals.push(0, 0, -1);
				for (let u = 0; u < uvsDataSize; u += 2)
					uvs.push(uvs[u], uvs[u+1]);
				for (let f = 0; f < faceDataSize; f += 3)
					faces.push(faces[f] + vertexCount, faces[f+1] + vertexCount, 
						faces[f+2] + vertexCount);
				vertexCount *= 2, triangleCount *= 2;
				break;
		}

		// Modify the anchor (after other vertex-modifying operations)
		if (this.anchor && this.anchor != 'middle') {
			let translateX = 0, translateY = 0;
			if (this.anchor.includes('left')) translateX = halfWidth;
			else if (this.anchor.includes('right')) translateX = -halfWidth;
			if (this.anchor.includes('top')) translateY = -halfHeight;
			else if (this.anchor.includes('bottom')) translateY = halfHeight;
		
			if (translateX != 0 || translateY != 0) {
				verticesDataSize = vertices.length
				for (let v = 0; v < verticesDataSize; v += 3) {
					vertices[v] += translateX; vertices[v+1] += translateY;
				}
			}
		}

		// Update the geometry attributes
		let attribute = THREE.Float32BufferAttribute; 
		this.geometry.setIndex(faces);
		this.geometry.setAttribute('position', new attribute(vertices, 3));
		this.geometry.setAttribute('normal', new attribute(normals, 3));
		this.geometry.setAttribute('uv', new attribute(uvs,2));

		// In debug mode, create additional elements to help visualize the result
		if (this.debug) {
			let anchor = new THREE.Mesh(new THREE.SphereGeometry(0.1),
				new THREE.MeshBasicMaterial({color: 0x00ff00}));
			this.add(anchor);
			let wireframe = new THREE.Mesh(this.geometry,
				new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true}));
			this.add(wireframe);
		}
	}
}
