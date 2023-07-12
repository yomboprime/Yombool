
// For Node

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

    module.exports = WebAppServer;

}

// ***** WebAppServer class *****

function WebAppServer( log ) {

    this.inited = false;

    this.config = null;

    this.log = log;

    this.listener = null;

    // Routes that have been served (can't un-serve)
    this.servedRoutes = [];

    // Resources
    this.fs = require( 'fs' );
    this.express = require( 'express' );
    this.pathJoin = require( 'path' ).join;
    this.http = require( 'http' );
    //this.WebSocket = require( 'ws' );

    this.app = null;
    this.httpServer = null;
    this.wss = null;

    // Clients
    this.clients = [];

    // Constants
    this.LOCAL_HOST_V4 = "::ffff:127.0.0.1";
    this.LOCAL_HOST_V4_BIS = "127.0.0.1";
    this.LOCAL_HOST_V6 = "::1";

}

WebAppServer.prototype = {

    constructor: WebAppServer

};

WebAppServer.prototype.start = function( config, listener ) {

    if ( this.inited ) {
        return;
    }

    this.config = config;

    this.listener = listener;

    // Create server
    this.app = this.express();
    this.httpServer = this.http.Server( this.app );
    //this.wss = new this.WebSocket.Server( { server: this.httpServer } );

    // Configure server

    const scope = this;

    // Serve favicon
    /*
    this.app.get( '/favicon.png', function( req, res ) {

        res.sendFile( scope.pathJoin( __dirname, '../../favicon.png' ) );

    } );
    */

    // Serve all public content
    this.mapDirectory( "/", this.pathJoin( "../../dist/" ) );

    // Setup connection with socket.io clients
    /*
    this.wss.on( 'connection', function( socket, req ) {
        scope.onClientConnectionInternal( socket, req );
    } );
    */

    this.inited = true;

    function listenFunction() {

        scope.log( "Server started." );

        scope.listener.onStartServer();

    }

    // Start listening
    if ( this.config.restrictToLocalHost ) {
        this.httpServer.listen( this.config.listenPort, "127.0.0.1", listenFunction );
    }
    else {
        this.httpServer.listen( this.config.listenPort, listenFunction );
    }

};

WebAppServer.prototype.stop = function( onStop ) {

    this.inited = false;

    this.listener = null;

    this.config = null;

    this.log( "Server stopped." );

    onStop();

};

/*
WebAppServer.prototype.isLocalClient = function( client ) {

    return this.isLocalAddress( client.socket.handshake.address );

};
*/

WebAppServer.prototype.isLocalRequest = function( req ) {

    return this.isLocalAddress( req.connection.remoteAddress );

};

WebAppServer.prototype.isLocalAddress = function( address ) {

    return this.LOCAL_HOST_V4 === address ||
        this.LOCAL_HOST_V6 === address ||
        this.LOCAL_HOST_V4_BIS === address;

};

WebAppServer.prototype.mapFile = function( webPath, path ) {

    path = path || webPath;

    const index = this.servedRoutes.indexOf( path );

    if ( index < 0 ) {

        this.servedRoutes.push( webPath );

        this.app.get( webPath, function( req, res ) {

            res.sendFile( pathJoin( __dirname, path ) );

        } );

    }

};

WebAppServer.prototype.mapDirectory = function( webPath, path ) {

    path = path || webPath;

    const index = this.servedRoutes.indexOf( webPath );

    if ( index < 0 ) {

        this.servedRoutes.push( webPath );

        this.app.use( webPath, this.express.static( this.pathJoin( __dirname, path ) ) );

    }

};

WebAppServer.prototype.mapFileArray = function( pathArray ) {

    for ( let i = 0, il = pathArray.length; i < il; i ++ ) {

        this.mapFile( pathArray[ i ] );

    }

};

WebAppServer.prototype.sendToClientsArray = function( array, messageData ) {

    for ( let i = 0, il = array.length; i < il; i ++ ) {

        array[ i ].socket.send( messageData );

    }

};

WebAppServer.prototype.removeClient = function( client, reasonString ) {

    client.socket.close( 0, reasonString );

};

WebAppServer.prototype.getClientParameters = function( req ) {

    return this.getURLParameters( req.headers.referer );

};

WebAppServer.prototype.getURLParameters = function( url ) {

    const params = [];

    url = decodeURI( url );

    const index = url.indexOf( "?" );
    if ( index >= 0 ) {
        const paramString = url.substring( index + 1 );
        const paramStringArray = paramString.split( "&" );
        for ( let i = 0; i < paramStringArray.length; i ++ ) {
            const p = paramStringArray[ i ];
            const index2 = p.indexOf( "=" );
            if ( index2 >= 0 ) {
                params.push( {
                    name: p.substring( 0, index2 ),
                    value: p.substring( index2 + 1 )
                } );
            }
        }

    }

    return params;

};

WebAppServer.prototype.gethostURL = function( path ) {

    // Get the url for this server and specified path

    if ( this.config.host !== "" ) {

        return "http://" + this.config.host + ":" + this.config.listenPort + path;

    }
    else {

        return "/" + path;

    }

};

// Main client connection function
WebAppServer.prototype.onClientConnectionInternal = function( socket, req ) {

    const client = {
        isGod: false,
        socket: socket,
		req: req
    };

    client.isGod = this.isLocalRequest( req );

    this.clients.push( client );

    //socket.heartbeatTimeout = this.config.connectionTimeout;

    const scope = this;

    socket.on( "close", function( msg ) {

        scope.listener.onClientDisconnection( client, msg );

        const index = scope.clients.indexOf( client );

        if ( index >= 0 ) {

            scope.clients.splice( index, 1 );

        }

    } );

    if ( this.listener.onClientConnection ) this.listener.onClientConnection( client );

};
