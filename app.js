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
  //. https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#recognize_sessionless_nonmp12
  //. req.file.path に audio/wav
  var filepath = req.file.path;

  var params = {
    audio: fs.createReadStream( filepath ),
    content_type: 'audio/wav',
    timestamps: true
  };
  speech_to_text.recognize( params, function( error, result ){
    if( error ){
      res.write( JSON.stringify( { status: 'ng', error: error }, 2, null ) );
      res.end();
    }else{
console.log( result );
      var transcript = '';
      for( var i = 0; i < 1 /*result.results.length*/; i ++ ){
        var r = result.results[i];
        if( r && r.alternatives ){
          var t = result.results[i].alternatives[0].transcript;
          transcript += t;
        }
      }
      res.write( JSON.stringify( { status: 'ok', result: transcript }, 2, null ) );
      res.end();
    }
    fs.unlink( filepath, function(e){} );
  });
});

app.post( '/t2s', function( req, res ){
  //. https://www.ibm.com/watson/developercloud/text-to-speech/api/v1/?node#synthesize_audio
  var text = req.body.text;

  var params = {
    text: text,
    accept: 'audio/wav',
    voice: 'en-US_AllisonVoice'
  };
  var transcript = text_to_speech.synthesize( params );
  transcript.on( 'error', function( error ){
    res.write( JSON.stringify( { status: 'ng', error: error }, 2, null ) );
    res.end();
  });
  transcript.on( 'response', function( response1 ){
    res.writeHead( 200, { 'Content-Type': 'audio/wav', 'Content-Length': transcript.size } );
  });

  transcript.pipe( res );

});

var port = appEnv.port || 3000;
app.listen( port );
console.log( "server starting on " + port + " ..." );



