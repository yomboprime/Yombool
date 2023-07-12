
// - Requires -

const fs = require( 'fs' );
const pathJoin = require( 'path' ).join;
const WebAppServer = require( "./WebAppServer.js" );
const serverUtils = require( "./serverUtils.js" );

// - Global variables -

let webAppServer;

let isAppEnding = false;
let exitAction = null;
const EXIT_NO_ACTION = 0;
const EXIT_ERROR = 1;

// - Main code -

initServer();

// - End of main code -


// - Functions -

function initServer() {

	process.on( "SIGINT", function() {

		console.log( "  SIGINT Signal Received, shutting down" );

		beginAppTermination( EXIT_NO_ACTION );

	} );

	createWebServer();

}

function createWebServer() {

	const listenPort = 45001;

	webAppServer = new WebAppServer( console.log );
	webAppServer.start( {
		"host": "",
		"listenPort": listenPort,
		"connectionTimeout": 1000,
		"restrictToLocalHost": true
	}, {
		onStartServer: function() {

			console.log( "Web server started." );

			//const browser = 'chromium-browser';
			const browser = 'firefox';

			serverUtils.spawnProgram( __dirname, browser, [ /*'--new-window',*/ 'http://localhost:' + listenPort + '/' ], ( code, output, error ) => {

			//serverUtils.spawnProgram( __dirname, 'firefox', [ '--new-window', 'http://localhost:' + listenPort + '/client.html' ], ( code, output, error ) => {
			//serverUtils.spawnProgram( __dirname, 'firefox', [ '--kiosk', '--new-window', 'http://localhost:' + listenPort + '/client.html' ], ( code, output, error ) => {
			//serverUtils.spawnProgram( __dirname, 'xdg-open', [ 'http://localhost:' + listenPort + '/client.html' ], ( code, output, error ) => {

				if ( code !== 0 ) {

					console.log( "Could not open default browser. Error: " + error );

				}

			}, true );

		},
		onClientConnection: null,
		onClientDisconnection: null

	} );

}


//

function getFileAbsolutePath( fileName ) {

	return pathJoin( __dirname, serverConfig.voxelNodePath, fileName );

}

function getFileRelativePath( fileName ) {

	return pathJoin( serverConfig.voxelNodePath, fileName );

}


function beginAppTermination( action ) {

	exitAction = action;

	finish();

}

function finish() {

	function salute( err ) {

		if ( ! err ) console.log( "Application terminated successfully. Have a nice day." );
		else console.log( "Application terminated With error. Have a nice day." );

	}

	switch ( exitAction ) {

		case EXIT_NO_ACTION:
			salute( false );
			process.exit( 0 );
			break;

		case EXIT_ERROR:
			salute( true );
			process.exit( 0 );
			break;

		default:
			console.log( "Unknown exit code." );
			salute( false );
			process.exit( 0 );
			break;

	}

}
