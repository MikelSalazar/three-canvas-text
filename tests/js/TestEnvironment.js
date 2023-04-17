import * as THREE from "three";
import { Text, Font } from '../../builds/three-canvas-text.module.js';

/** Creates a basic 3D test environment. */
export class TestEnvironment {

	/** Initializes a new instance of the TestEnvironment class. 
	 * @param params The initialization parameters. */
	constructor(params = {}) {
		
		// Create the renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.canvas = this.renderer.domElement;
		document.body.appendChild(this.canvas);

		// Create the scene
		this.scene = new THREE.Scene();
	
		// Create a directional light
		this.light = new THREE.DirectionalLight();
		this.scene.add(this.light);

		// Create an orthographic camera
		this.camera = new THREE.OrthographicCamera(-1,1,1,-1,-10,10);
		this.camera.position.x = params.x || 0;
		this.camera.position.y = params.y || 0;
		this.camera.position.z = params.z || 2;
		this.aspect = 1; 
		this.zoom = params.zoom || 6; 
		this.zoomFactor = params.zoomFactor || 1.2;

		// Initialize the debug panel
		this.debug = document.createElement('p');
		this.debug.style.cssText = 'position: fixed; top:0; left:0; ' +
			'font: 2vh Arial; color: white; background: #0008; ' +
			'padding: 1vmin; pointer-events: none;';
		this.debug.innerText = 'Debug';
		document.body.appendChild(this.debug);

		// Create the values for the FPS 
		this.deltaTime = 0; this.lastTime = 0; this.fpsCounter = 0;
		this.fpsTimer = 1;	this.fpsValue = 0; 
		this.fpsMinValue = 0; this.fpsMaxValue = 0; 
		this.fpsValues = []; this.fpsValuesMaxSize = 10;

		// Create a double grid to better estimate distances
		let grid = new THREE.GridHelper(4,40, 0xffffff);
		grid.rotation.x = Math.PI/2;
		this.scene.add(grid);
		let grid2 = new THREE.GridHelper(10,10, 0xffffff, 0xffffff);
		grid2.rotation.x = Math.PI/2; 
		this.scene.add(grid2);


		// Create the events
		this.onUpdate = null; this.onResize = null; this.onMove = null;

		// React to the events of the 
		window.onresize = this.resize.bind(this); 
		window.onmousemove = (event) => {
			if (event.buttons) {
				let factor = this.zoom * 2, elem = this.canvas,
					width = elem.clientWidth, height = elem.clientHeight;
				this.move(-(factor * event.movementX * this.aspect) / width,
					(factor * event.movementY) / height);
			}
		}
		this.canvas.onwheel = (event) => {
			let factor = this.zoom * 2, elem = this.canvas,	
				width = elem.clientWidth, height = elem.clientHeight,
				cursorX = event.clientX - elem.clientWidth / 2,	
				cursorY = event.clientY - elem.clientHeight / 2;
	
			// Zoom while keeping the cursor in the same point
			let startX = ((factor * cursorX * this.aspect) / width), 
				startY = (-(factor * cursorY) / height);
			this.zoom *= (Math.sign(event.deltaY) > 0)? 
				this.zoomFactor : 1 / this.zoomFactor;
			factor = this.zoom * 2
			let endX = ((factor * cursorX * this.aspect) / width), 
				endY = (-(factor * cursorY) / height);
			this.move(startX - endX, startY - endY);

			// Update the camera projection matrix
			this.camera.top = this.zoom; 
			this.camera.bottom = -this.zoom;
			this.camera.left = -this.zoom * this.aspect; 
			this.camera.right = -this.camera.left;
			this.camera.updateProjectionMatrix();
		}

		// Start updating the canvas
		this.resize(); this.update();
	}


	/** Adds a text to the scene
	 * @param {*} text The text to add (or a string with the characters).
	 * @param {*} font The font of the text (or a string with the font name).
	 * @param {*} x The position of the text in the X axis.
	 * @param {*} y The position of the text in the Z axis.
	 * @param {*} debug Activates the debug mode. */
	addText(text, font = "", x = 0, y = 0, debug = false) {
		if (typeof text == 'string') text = new Text(
			{ string: text, font: font, debug: debug });
		else if (typeof text == 'object') {
			if (font) text.font = new Font(font);
			if (debug) text.debug = true;
			text = new Text(text);
		}
		text.position.set(x, y, 0);
		this.scene.add(text);
		return text;
	}


	/** Resizes the camera. 
	 * @param {*} x The movement in the X coordinate.
	 * @param {*} y The movement in the Y coordinate. */
	move(x, y) {
		this.camera.position.x += x; this.camera.position.y += y;
		if (this.onMove) this.onMove(x, y);
	}


	/** Resizes the viewport. */
	resize() {
		let  width = window.innerWidth, height = window.innerHeight;
		this.aspect = width / height;
		this.camera.top = this.zoom; this.camera.bottom = -this.zoom;
		this.camera.left = -this.zoom * this.aspect; 
		this.camera.right = -this.camera.left;
		this.camera.updateProjectionMatrix();
		this.renderer.setPixelRatio(devicePixelRatio);
		this.renderer.setSize(width, height);
	}


	/** Updates the viewport.
	 * @param timestamp The current time (in milliseconds).	*/
	update(timestamp = 0) {

		// Update the delta time and Frames Per Second counter
		let time = timestamp / 1000; // Convert the time to seconds
		this.deltaTime = time - this.lastTime; this.lastTime = time;
		this.fpsTimer += this.deltaTime; this.fpsCounter++;
		if (this.fpsTimer >= 1) {
			let fpsValue = this.fpsValue = this.fpsCounter;
			let info = this.renderer.info, memory = performance.memory,
				mb = 1024 * 1024 ;
			if (this.fpsValues.length >= this.fpsValuesMaxSize)
				this.fpsValues.shift();
			this.fpsValues.push(this.fpsValue);
			
			this.fpsMinValue = Number.MAX_VALUE; 
			this.fpsMaxValue = Number.MIN_VALUE;  
			for (fpsValue of this.fpsValues ) {
				if (this.fpsMinValue > fpsValue) this.fpsMinValue = fpsValue;
				if (this.fpsMaxValue < fpsValue) this.fpsMaxValue = fpsValue;
			}

			this.fpsTimer %= 1; this.fpsCounter = 0;
			this.debug.innerHTML = "FPS: " + this.fpsValue + 
				' (' + this.fpsMinValue + ' / ' + this.fpsMaxValue + ')<br>' +
				'Geometries: ' + info.memory.geometries + '<br>' +
				'Textures: ' + info.memory.textures + '<br>' +
				'Calls: ' + info.render.calls + '<br>';
			if (memory) this.debug.innerHTML +=
				"Memory: " + (memory.usedJSHeapSize/mb).toFixed() + " / " +
					(memory.jsHeapSizeLimit/mb).toFixed() + ' MB';
		}

		// Render the scene
		this.renderer.render(this.scene, this.camera);
		requestAnimationFrame(this.update.bind(this));

		// Launch the event
		if (this.onUpdate) this.onUpdate(timestamp, this.deltaTime);
	};

	listFonts() {
		console.log("Fonts");
		for (let font of document.fonts) {
			console.log(font.family);
		}
		
	} 
}

// Create a way to facilitate the initialization of the test environment.
TestEnvironment.init = (params) =>{ return new TestEnvironment(params); }

// Show errors as dialog boxes
window.onerror = (message) => { alert(message); }

// Create a button to go back to the index
if (window.self == window.top) {
	let backButton = document.createElement('button');
	backButton.innerText = 'Index';
	backButton.style.cssText = 'position: fixed; right: 0; top: 0;' +
		' font: 2vh Arial; color: white; background: #0008; ' +
		' border: 1px solid white; padding: 1vmin; margin: 1vmin;';
	backButton.onclick = () => { location.href = './index.html'; }
	document.body.append(backButton);
}