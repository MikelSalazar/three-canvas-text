/******************************************************************************
 * File: build.js
 * Project: three-canvas-text
 * Description: Builds the different distributables of the project.
 *****************************************************************************/

// -------------------------------------------------------------------- IMPORTS
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'node:child_process'


// ----------------------------------------------------------- GLOBAL VARIABLES

// Get the current file name and folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const textFile = { encoding: 'utf-8' };
const startTag = "!s", endTag = "!e";


// Set the path to the project root folder
let rootFolderPath = path.join(__dirname, '../../');
let data, projectId, projectName, projectVersion, filePaths = [], external = [],
	sourcesFolderPath, docsFolderPath, typesFolderPath,
	outputFolderPath, temporalFolderPath, modulesFolderPath;

// Values to control the process
let preserveFormat = true;

// ---------------------------------------------------------- UTILITY FUNCTIONS

/** Reads a text file.
 * @param filepath The path to the text file.
 * @returns The text data. */
function readFile(filepath) { return fs.readFileSync(filepath, textFile); }


/** Writes a text file.
 * @param filepath The path to the text file.
 * @param data the text data. */
function writeFile(filepath, data){
	let folderPath = path.dirname(filepath);
	if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, {recursive: true});
	fs.writeFileSync(filepath, data, textFile);
}

/** Processes the source files.
 * @param {*} folderPath The folder path*/
function processSourceFolder(folderPath) {
	let paths = fs.readdirSync(folderPath), folderPaths = [];
	for (let absolutePath of paths) {
		absolutePath = path.join(folderPath, absolutePath);
		if (fs.lstatSync(absolutePath).isFile()) {
			let relativePath = path.relative(sourcesFolderPath, absolutePath);
			let fileId = relativePath;
			if (fileId.endsWith('.ts')) fileId = fileId.slice(0,-3);
			else throw Error('Invalid file extension for: ' + absolutePath);

			console.log('    Processing: ' + relativePath);
			let data = readFile(absolutePath, textFile);

			// Process the file line by line
			let lines = data.split('\n'), lineIndex, lineCount = lines.length;
			let mlComment = false;
			for (lineIndex = 0; lineIndex < lineCount; lineIndex++) {
				let line = lines[lineIndex].trimRight(), l = line.trim();
				
				// Get the referenced fields
				if ((l.startsWith('import') || l.startsWith('export')) &&
					l.includes(' from ')) {
					let delimiter = '\'', end = line.lastIndexOf(delimiter);
					if (end <= 0) { delimiter = '"'; end = line.lastIndexOf('"'); }
					if (end > 0) {
						let start = line.slice(0, end).lastIndexOf(delimiter);
						let importPath = line.slice(start + 1, end);
						if (importPath.startsWith('./')) 
							importPath = path.join(sourcesFolderPath, importPath);
						else if (importPath.startsWith('../')) 
							importPath = path.join(folderPath, importPath);
						else continue;
						importPath = path.relative(sourcesFolderPath, importPath);
						if (!filePaths.includes(importPath)) filePaths.push(importPath);
					}
					continue;
				}

				// Try to reserve the original format
				if (preserveFormat) {
					let tabs = 0; while(line[tabs] == '\t') tabs++;
					if (!mlComment) {
						if (l.startsWith('/**')) mlComment = true;
						line = "/*" + startTag + ((tabs < 10)? "0": "") + tabs + 
							"," + ((mlComment)? "1": "0") + "*/" + line.trim();
					}
					if (l.endsWith('*/')) mlComment = false;
					if (!mlComment) line +=  "/*" + endTag + "*/";
				}
				lines[lineIndex] = line.trimEnd();
			}

			// Join the lines again
			data = lines.join('\n');

			// Add the file to the list
			if (!filePaths.includes(fileId)) filePaths.push(fileId);

			// Save a copy of the file in a temporal folder
			let temporalFilePath = path.join(temporalFolderPath, relativePath);
			writeFile(temporalFilePath, data);
		}
		else folderPaths.push(absolutePath);
	}
	folderPaths.forEach(folderPath => processSourceFolder(folderPath));
}


/** Processes a Typescript declaration file.
 * @param filePath The path of the Typescript declaration file. */
function processDeclarationFile(filePath) {
	let relativePath = filePath + '.d.ts';
	console.log('    Processing: ' + relativePath);
	let data = readFile(path.join(temporalFolderPath, relativePath));
	// Process the file line by line
	let lines = data.split('\n'), lineIndex, lineCount = lines.length,
		multilineComment = false;
	for (lineIndex = 0; lineIndex < lineCount; lineIndex++) {
		let line = lines[lineIndex].trimRight(), trimmedLine = line.trim();
		let tabs = 0, spaces = 0; while(line[spaces] == ' ') spaces++;
		if (preserveFormat) {
			if (trimmedLine.startsWith("/*" + startTag)) {
				tabs = parseInt(trimmedLine.slice(4,6));
				multilineComment = (trimmedLine.slice(7,8)=="1") || tabs == 0;
				line = "\t".repeat(tabs) + trimmedLine.slice(11);
				let nextLine = trimmedLine; 
				while (!nextLine.endsWith(endTag + "*/") && !multilineComment) {
					nextLine = lines[lineIndex + 1].trim();
					if (nextLine.startsWith("/*" + startTag)) break;
					line = line + ((line.trim().length > 0)? " ":"") + nextLine;
					lines.splice(lineIndex + 1, 1); lineCount--;
				}
			}
			if (multilineComment) {
				if (tabs == 0 && lines[lineIndex].startsWith(' ')) tabs = 1;
				line = "\t".repeat(tabs) + line.replace(/((\t|    ))/g, '');
			}
			if (line.endsWith(endTag + "*/")) 
				line = line.slice(0, line.length - 6);
			lines[lineIndex] = line.trimEnd();
		}
		if (line.trim().startsWith('/*' + startTag)) line = "";
		lines[lineIndex] = line.trimEnd();
	}
	
	// Rejoin the different lines (with a maximum of 3 blank lines)
	data = lines.join('\n').replace(/[\n]{3,}/g, '\n\n\n')
	
	// Remove any remaining special comment
	data = data.replace(/\/\*\![^\*]*\*\/( )*/g, '');

	// Save the resulting data
	writeFile(path.join(typesFolderPath, relativePath), data);
}


/** Processes a Javascript file.
 * @param filePath The path of the Javascript file. */
function processJavascriptFile(filePath, isModule) {

	let relativePath = filePath + '.js';
	console.log('    Processing: ' + relativePath);
	let data = readFile(path.join(temporalFolderPath, relativePath));

	// Process the file line by line
	let lines = data.split('\n'), lineIndex, lineCount = lines.length;
	let multilineComment = false;
	for (lineIndex = 0; lineIndex < lineCount; lineIndex++) {
		let line = lines[lineIndex].trimRight(), trimmedLine = line.trim();
		let tabs = 0, spaces = 0; while(line[spaces] == ' ') spaces++;

		if (preserveFormat) {
			if (trimmedLine.startsWith("/*" + startTag)) {
				tabs = parseInt(trimmedLine.slice(4,6));
				multilineComment = (trimmedLine.slice(7,8)=="1") || tabs == 0;
				line = "\t".repeat(tabs) + trimmedLine.slice(11);
				let nextLine = trimmedLine; 
				while (!nextLine.endsWith(endTag + "*/") && !multilineComment) {
					
					// Advance to the next line
					nextLine = lines[lineIndex + 1].trim();

					// If there is a next block, just keep the line
					if (nextLine.startsWith("/*" + startTag)) break;
					
					// Add the line to the end
					line = line + ((line.trim().length > 0)? " ":"") + nextLine;

					// Remove the next line
					lines.splice(lineIndex + 1, 1); lineCount--;
				}

			}
			if (multilineComment) {
				if (tabs == 0 && lines[lineIndex].startsWith(' ')) tabs = 1;
				line = "\t".repeat(tabs) + line.replace(/((\t|    ))/g, '');
			}
		if (line.endsWith(endTag + "*/")) 
				line = line.slice(0, line.length - 6);
			lines[lineIndex] = line.trimEnd();
		}

		// Add the js extension at the end of exports
		if ((trimmedLine.startsWith('import') || 
			trimmedLine.startsWith('export')) &&
			trimmedLine.includes(' from ')) {
			let delimiter = '\'', end = line.lastIndexOf(delimiter);
			if (end <= 0) { delimiter = '"'; end = line.lastIndexOf('"'); }
			if (end > 0) {
				let start = line.slice(0, end).lastIndexOf(delimiter);
				let importPath = line.slice(start + 1, end)
				if (importPath.startsWith('.')) {
					if (isModule == true) 
						line = line.slice(0, end) + '.js' + delimiter;
					else line = '';
				} else {
					if (isModule == false) {
						if (external.includes(importPath)) line = '';
						else external.push((importPath)); 
					}
				}
			}
		}

		lines[lineIndex] = line;
	}

	// Rejoin the different lines
	data = lines.join('\n');

	// Save the resulting data
	writeFile(path.join(modulesFolderPath, relativePath), data);
}


/** Processes a source map file.
 * @param filePaths The paths of the files to combine.
 * @param combinedFilePath The path of the combined file. */
function combineFiles(filePaths, combinedFilePath, isModule = true) {
	let combinedData = "", globalImports = [];

	for (let filePath of filePaths) {
		let data = readFile(filePath);
		let lines = data.split('\n'), lineIndex, lineCount = lines.length;
		for (lineIndex = 0; lineIndex < lineCount; lineIndex++) {
			let line = lines[lineIndex].trimRight(), trimmedLine = line.trim();
	
			// Adjust the import declarations
			if (trimmedLine.startsWith('import')) {
				if (isModule) {
					let delimiter = '\'', end = line.lastIndexOf(delimiter);
					if (end <= 0) { 
						delimiter = '"'; end = line.lastIndexOf(delimiter); 
					}
					if (end > 0) {
						let start = line.slice(0, end).lastIndexOf(delimiter);
						let importPath = line.slice(start + 1, end);
						
						// Extract the global imports
						if (!importPath.startsWith('.') && 
							!globalImports.includes(line))
								globalImports.push(line);
					}
				} 
				lines[lineIndex] = '';
			}

			if (!isModule && trimmedLine.startsWith('export ')) {
				lines[lineIndex] = lines[lineIndex].replace('export ', '');
			}
			
		}
		data = lines.join('\n');
		combinedData += data + '\n';
	}

	// Add the global imports
	if (isModule) combinedData = globalImports.join('\n') + combinedData;
	
	// Write the result
	writeFile(combinedFilePath, combinedData);
}


/** Processes a source map file.
 * @param filePath The path of the source map file. */
function processSourceMapFile(filePath) {
	if (! fs.existsSync(filePath)) return; 
	let data = readFile(filePath);
	data = JSON.parse(data); data = JSON.stringify(data, null, '\t');
	let lines = data.split('\n'), lineIndex, lineCount = lines.length;
	for (lineIndex = 0; lineIndex < lineCount; lineIndex++) {
		if (lines[lineIndex].endsWith('[')) {	// Compress arrays
			let value; do {
				value = lines[lineIndex+1].trim();
				lines[lineIndex] += ' ' + value;
				lines.splice(lineIndex+1, 1); lineCount--;
			} while (!value.startsWith(']'));
		}
	}
	data = lines.join('\n');
	writeFile(filePath, data, textFile);
}


// ---------------------------------------------------------------- ENTRY POINT

// Read the package data from the NPM "package.json" file
try { data = JSON.parse(readFile(rootFolderPath + '/package.json')); }
catch (e) { throw Error("Unable to read the package.json file"); }
try {
	// The project name is the id
	projectId = data.name; 
	if (!projectId) throw 'Undefined "name"';

	// The project version
	projectVersion = data.version; 
	if (!projectVersion) throw 'Undefined "version"';

	// The actual project name is in the keywords
	if (!data.keywords) throw 'Undefined "keywords"';
	projectName = data.keywords[0];
	if (!projectName) throw 'Undefined project title in "keywords"';

	// Get the different folder paths
	let dir = data.directories; if (!dir) throw 'Undefined "directories"';
	if (!dir.src) throw 'Undefined directory "src"';
	sourcesFolderPath = path.join(rootFolderPath, dir.src); 
	if (!dir.doc) throw 'Undefined directory "doc"';
	docsFolderPath = path.join(rootFolderPath, dir.doc); 
	if (!dir.bin) throw 'Undefined directory "bin"';
	outputFolderPath = path.join(rootFolderPath, dir.bin); 
	temporalFolderPath = path.join(outputFolderPath, 'temporal'); 
	modulesFolderPath = path.join(outputFolderPath, 'modules'); 
	typesFolderPath = path.join(outputFolderPath, 'types'); 
} catch (e) { throw Error(e + ' in package.json file'); }


// Show a message on console to indicate the start of the process
console.log('BUILDING ' + projectName + ' (' + projectVersion + ')');

// // Clean the builds folder
// console.log(' Cleaning the output directory...');
// if (fs.existsSync(outputFolderPath)) {
// 	let paths = fs.readdirSync(outputFolderPath);
// 	paths.forEach(filePath => {
// 		filePath = path.join(outputFolderPath, filePath);
// 		fs.rmSync(filePath, { recursive: true });
// 	});
// } else fs.mkdirSync(outputFolderPath);

// // Create the temporal folder
// fs.mkdirSync(temporalFolderPath);

// Create a temporal copy of the files for the transpilation
console.log('  Processing Typescript files...');
processSourceFolder(sourcesFolderPath);

// Transpile the Typescript files
console.log('  Transpiling Typescript files...');
let typescriptCommand = 'tsc ' +
	' --target es2016' +
	' --declaration ' +
	// ' --sourceMap' +
	' --outDir ' + temporalFolderPath +
	' ' + filePaths.join('.ts ') + '.ts';
console.log(typescriptCommand);
execSync(typescriptCommand, {cwd: temporalFolderPath, stdio: 'inherit'});

// Process the Typescript files
console.log('  Processing Javascript files for minifying...');
for (let filePath of filePaths) processJavascriptFile(filePath, false);

// Minimize the result
console.log('  Minimizing the Javascript files...');
let outputFileName =  projectId, 
	outputFilePath = path.join(outputFolderPath, outputFileName);
let terserCommand = 'terser' +
	' --source-map' +
	' --module' +
	' -o ' + '../' + outputFileName + '.min.js' +
	' ' + filePaths.join('.js ') + '.js';
console.log(terserCommand);
execSync(terserCommand, {cwd: modulesFolderPath, stdio: 'inherit'});

// Repeat the process but do not remove 
console.log('  Processing Javascript files for modules...');
for (let filePath of filePaths) processJavascriptFile(filePath, true);

console.log('  Processing Declaration files...');
for (let filePath of filePaths) processDeclarationFile(filePath, true);

// Combine the result
console.log('  Combining the Javascript files...');
let modulesFilePaths = [], typesFilePaths = [];
for (let filePath of filePaths){
	modulesFilePaths.push(path.join(modulesFolderPath, filePath + '.js'));
	typesFilePaths.push(path.join(typesFolderPath, filePath + '.d.ts'));
}
combineFiles(modulesFilePaths, outputFilePath + '.module.js');
combineFiles(modulesFilePaths, outputFilePath + '.js', false);
combineFiles(typesFilePaths, outputFilePath + '.d.ts');

// Remove the temporal folder
fs.rmSync(temporalFolderPath, { recursive: true });

// Show a message on console to indicate the successful end of the build
console.log('BUILD PROCESS COMPLETED');