//. settings.js
exports.s2t_username = 'username';
exports.s2t_password = 'password';
exports.t2s_username = 'username';
exports.t2s_password = 'password';
//exports.lang = 'ja';
exports.questions = {
  'en': [
    'Good morning.',
    'This is a pen.',
    'How have you been?',
    'Wow. That sounds interesting!',
    'I prefer coffee.'
  ],
  'de': [
    'Hallo.',
    'Ich liebe dich.',
    'Es machte mich nervos.',
    'Wir mogen Bier!',
    'Wie kann ich nach Berlin kommen?'
  ],
  'pt': [
    'Hola',
    'te amo',
    'Me puso nervioso.',
    'Amamos el futbol',
    '?Como puedo llegar a Lisboa?'
  ],
  'ja': [
    'おはようございます',
    'こんにちは',
    '今日はいい天気ですね',
    '私はペンとリンゴを持っています',
    'ただ恋をしてるだけなの　機械みたいに生きてるわけじゃない'
  ]
};

if( process.env.VCAP_SERVICES ){
  var VCAP_SERVICES = JSON.parse( process.env.VCAP_SERVICES );
  if( VCAP_SERVICES && VCAP_SERVICES.text_to_speech ){
    exports.t2s_username = VCAP_SERVICES.text_to_speech[0].credentials.username;
    exports.t2s_password = VCAP_SERVICES.text_to_speech[0].credentials.password;
  }
  if( VCAP_SERVICES && VCAP_SERVICES.speech_to_text ){
    exports.s2t_username = VCAP_SERVICES.speech_to_text[0].credentials.username;
    exports.s2t_password = VCAP_SERVICES.speech_to_text[0].credentials.password;
  }
}

