
const fs = require( 'fs' );
const { spawn, exec } = require( 'child_process' );

function loadFileJSON( path, encoding ) {

	try {

		return JSON.parse( loadFile( path, encoding ) );

	}
	catch ( e ) {

		return null;

	}

}

function saveFileJSON( path, jsonObject, encoding ) {

	// TODO not tested
	saveFile( path, JSON.stringify( jsonObject, true, 4 ), 'latin1' );

}

function loadFile( path, encoding ) {

	try {

		return fs.readFileSync( path, encoding ? encoding : undefined );

	}
	catch ( e ) {

		return null;

	}

}

function saveFile( path, contents, encoding ) {

	try {

		fs.writeFileSync( path, contents, encoding ? encoding : undefined );
		return true;

	}
	catch ( e ) {

		return false;

	}

}

function spawnProgram( cwd, program, args, callback, cancelOutput, onMessage ) {

	let p;

	if ( cwd ) p = spawn( program, args, { cwd: cwd } );
	else p = spawn( program, args );

	let output = "";
	let error = "";

	p.stdout.on( 'data', ( data ) => {

		if ( ! cancelOutput ) output += data;

		if ( onMessage ) onMessage( data );

	} );

	p.stderr.on( 'data', ( data ) => {

		error += data;

	} );

	p.on( 'exit', ( code, signal ) => {

		if ( callback ) {

			callback( code, output, error );

		}

	} );

}

function execProgram( cwd, command, callback, cancelOutput ) {

	let p;

	if ( cwd ) p = exec( command, { cwd: cwd } );
	else p = exec( command );

	let output = "";
	let error = "";

	p.stdout.on( 'data', ( data ) => {

		if ( ! cancelOutput ) output += data;

	} );

	p.stderr.on( 'data', ( data ) => {

		error += data;

	} );

	p.on( 'exit', ( code, signal ) => {

		if ( callback ) {

			callback( code, output, error );

		}

	} );

}

function getLocaleDate( callback ) {

	spawnProgram( null, "date", [ ], ( code, output, err ) => {

		callback( output );

	} );

}

function isBeneath( path, base ) {

	return ( "" + path ).startsWith( base );

}


function getFilenameExtension( path ) {

	path = path || "";

	const pathLastIndexOfDot = path.lastIndexOf( "." );

	if ( pathLastIndexOfDot > 0 && path.length > pathLastIndexOfDot + 1 ) {

		return path.substring( pathLastIndexOfDot + 1 );

	}
	else return "";

}


function removeFilenameExtension( path ) {

	path = path || "";

	const pathLastIndexOfDot = path.lastIndexOf( "." );

	if ( pathLastIndexOfDot > 0 && path.length > pathLastIndexOfDot + 1 ) {

		return path.substring( 0, pathLastIndexOfDot );

	}
	else return "";

}

function removePathFromFilename( path ) {

	path = path || "";

	const pathLastIndexOfSlash = path.lastIndexOf( "/" );

	if ( pathLastIndexOfSlash > 0 && path.length > pathLastIndexOfSlash + 1 ) {

		return path.substring( pathLastIndexOfSlash + 1 );

	}
	else return path;

}

module.exports = {
	loadFileJSON,
	saveFileJSON,
	loadFile,
	saveFile,

	spawnProgram,
	execProgram,

	getLocaleDate,
	isBeneath,
	getFilenameExtension,
	removeFilenameExtension,
	removePathFromFilename
};
