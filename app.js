//.  app.js
var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    cfenv = require( 'cfenv' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    s2t = require( 'watson-developer-cloud/speech-to-text/v1' ),
    t2s = require( 'watson-developer-cloud/text-to-speech/v1' ),
    settings = require( './settings' ),
    app = express();
var speech_to_text = new s2t({ username: settings.s2t_username, password: settings.s2t_password });
var text_to_speech = new t2s({ username: settings.t2s_username, password: settings.t2s_password });
var appEnv = cfenv.getAppEnv();

app.use( multer( { dest: './tmp/' } ).single( 'data' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.static( __dirname + '/public' ) );

app.get( '/', function( req, res ){
  var template = fs.readFileSync( __dirname + '/public/index.ejs', 'utf-8' );
  res.write( ejs.render( template, {} ) );
  res.end();
});

app.post( '/s2t', function( req, res ){
  //. req.file.path に audio/wav
  var filepath = req.file.path;
  var stream = fs.createReadStream( filepath );
  stream.on( 'data', function( chunk ){
  });
  stream.on( 'end', function(){
    var params = {
      audio: stream,
      content_type: 'audio/wav'  //req.file.type
    };

    speech_to_text.recognize( params, function( error, result ){
      fs.unlink( filepath, function( err ){} );
console.log( error );
console.log( result );
      if( error ){
        res.write( JSON.stringify( { status: 'ng', error: error }, 2, null ) );
        res.end();
      }else{
        res.write( JSON.stringify( { status: 'ok', result: result }, 2, null ) );
        res.end();
      }
    });
  });
});


var port = appEnv.port || 3000;
app.listen( port );
console.log( "server starting on " + port + " ..." );



