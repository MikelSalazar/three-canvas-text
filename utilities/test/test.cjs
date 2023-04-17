/******************************************************************************
 * File: test.js
 * Project: three-canvas-text
 * Description: A Electron script to properly test the features of the project.
 *****************************************************************************/

// Get the basic classes to create an Electron app
//import { app, BrowserWindow } from 'electron';
const { app, BrowserWindow } = require('electron')

// Disable security messages
delete process.env.ELECTRON_ENABLE_SECURITY_WARNINGS;
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

/** Creates a window. */
function createWindow () {
	const win = new BrowserWindow({ 
		fullscreen: true, 			// Make the window fullscreen
		show: false,				// Hide the window initially
		webPreferences: {			
			devTools: true,			// Show the development tools
		}
	});
	// Hide the menu bar
	win.setAutoHideMenuBar(true);
	
	// Load the index file in the "tests" folder and show the window afterwards
	win.loadFile('../../tests/index.html');
	win.once('ready-to-show', () => { 
		win.webContents.openDevTools(); win.show();
	});
}

// Launch the 
app.whenReady().then(() => {
	
	// Create the window of the app
	createWindow();

	// app.on('activate', () => {
	// 	if (BrowserWindow.getAllWindows().length === 0) createWindow();
	// })
})

// When all windows are closed, close the process
app.on('window-all-closed', ()=>{ app.quit(); })
