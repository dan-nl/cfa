/**
 * module variables
 */
var fs;
var http;
var mime_types;
var path;
var port;
var sass;
var sass_options;
var server;
var url;

/**
 * variable assignments
 */
fs = require( 'fs' );
http = require( 'http' );
mime_types = {
  'html': 'text/html',
  'js': 'text/javascript',
  'css': 'text/css',
  'csv': 'text/csv'
};
path = require( 'path' );
port = 3000;
sass = require( 'node-sass' );
sass_options = {
  file: './assets/scss/styles.scss',
  outputStyle: 'compressed',
  outFile: './public/css/styles.css'
};
server = http.createServer( handleRequest );
url = require( 'url' );

function handleRequest( request, response ) {
  var uri;
  var filename;

  uri = url.parse( request.url ).pathname;

  if ( uri === '/' ) {
    uri = 'index.html';
  }

  filename = path.join( process.cwd(), 'public', uri );

  fs.exists(
    filename,
    function ( exists ) {
      var fileStream;
      var mime_type;

      if ( !exists ) {
        console.error( '404 Not Found: ' + filename );
        response.writeHead( 404, { 'Content-Type': 'text/plain' } );
        response.write( '404 Not Found\n' );
        response.end();
        return;
      }

      mime_type = mime_types[ path.extname( filename ).split( '.' )[ 1 ] ];
      response.writeHead( 200, { 'Content-Type': mime_type } );
      fileStream = fs.createReadStream( filename );
      fileStream.pipe( response );
    }
  );
}

function handleListen() {
  console.log( "Server listening on: http://localhost:%s", port );
}

function handleSassRender( error, result ) {
  if ( error ) {
    console.log( 'sass error:', error.message );
    return;
  }

  fs.writeFile( sass_options.outFile, result.css, function( err ) {
    if ( err ) {
      console.error( err );
    }
  });
}

sass.render( sass_options, handleSassRender );
server.listen( port, handleListen );