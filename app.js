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
  var questions = settings.questions;

  var template = fs.readFileSync( __dirname + '/public/index.ejs', 'utf-8' );
  res.write( ejs.render( template, { questions: questions} ) );
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
      //console.log( JSON.stringify(result,2,null) );
/*
{
 "results":[
  {
   "alternatives":[
    {
     "timestamps":[
      ["it",0.04,0.37],
      ["was",0.37,0.57],
      ["one",0.57,0.77],
      ["of",0.77,0.83],
      ["the",0.83,0.9],
      ["things",0.9,1.08]
     ],
     "confidence":0.475,
     "transcript":"it was one of the things "
    }
   ],
   "final":true
  },
  {
   "alternatives":[
    {
     "timestamps":[
      ["Norma",2.1,2.63]
     ],
     "confidence":0.099,
     "transcript":"Norma "
    }
   ],
   "final":true
  }
 ],
 "result_index":0
}
*/
      var transcript = '';
      for( var i = 0; i < result.results.length; i ++ ){
        var r = result.results[i];
        if( r && r.alternatives ){
          var t = result.results[i].alternatives[0].transcript;
          transcript += ( " " + t );
        }
      }
      res.write( JSON.stringify( { status: 'ok', result: transcript }, 2, null ) );
      res.end();
    }
    fs.unlink( filepath, function(e){} );
  });
});

app.get( '/t2s', function( req, res ){
  //. https://www.ibm.com/watson/developercloud/text-to-speech/api/v1/?node#synthesize_audio
  var text = req.query.text;
  var voice = req.query.voice;

  var params = {
    text: text,
    accept: 'audio/wav',
    voice: voice
  };

  text_to_speech.synthesize( params )
  .on( 'error', function( error ){
    res.write( JSON.stringify( { status: 'ng', error: error }, 2, null ) );
    res.end();
  }).on( 'response', function( response1 ){
    res.writeHead( 200, { 'Content-Type': 'audio/wav' } );
  }).pipe( res );
});

app.post( '/compare', function( req, res ){
  var question = req.body.question;
  var answer = req.body.answer;
  var score = 0.0;

  var qs = question.split( ' ' );
  var as = answer.split( ' ' );

  //. question に使われている単語のどれだけを認識させることができたか？ 
  var q_count = 0;
  for( var i = 0; i < qs.length; i ++ ){
    var q = as[i];
    if( q.endsWith( '.' ) || q.endsWith( '!' ) || q.endsWith( '?' ) ){
      q = q.substring( 0, q.length - 1 );
    }
    var b = false;
    for( var j = 0; j < as.length && !b; j ++ ){
      var a = as[j];
      if( a.endsWith( '.' ) || a.endsWith( '!' ) || a.endsWith( '?' ) ){
        a = a.substring( 0, a.length - 1 );
      }
      b = ( a.toLowerCase() == q.toLowerCase() );
    }
    if( b ){
      q_count ++;
    }
  }
  score = 100.0 * q_count / qs.length;

  //. answer に使われている単語のどれだけが誤認識だったか？
  var a_count = 0;
  for( var i = 0; i < as.length; i ++ ){
    var a = as[i];
    if( a.endsWith( '.' ) || a.endsWith( '!' ) || a.endsWith( '?' ) ){
      a = a.substring( 0, a.length - 1 );
    }
    var b = false;
    for( var j = 0; j < qs.length && !b; j ++ ){
      var q = as[j];
      if( q.endsWith( '.' ) || q.endsWith( '!' ) || q.endsWith( '?' ) ){
        q = q.substring( 0, q.length - 1 );
      }
      b = ( a.toLowerCase() == q.toLowerCase() );
    }
    if( !b ){
      a_count ++;
    }
  }
  score -= score * a_count / as.length;

  console.log( 'question = ' + question + ', answer = ' + answer );
  console.log( 'q_count = ' + q_count + ', qs.length = ' + qs.length );
  console.log( 'a_count = ' + a_count + ', as.length = ' + as.length );
  console.log( ' score = ' + score );

  res.write( JSON.stringify( { status: 'ok', score: score }, 2, null ) );
  res.end();
});

var port = appEnv.port || 3000;
app.listen( port );
console.log( "server starting on " + port + " ..." );



