
/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , user = require('./routes/user')
    , http = require('http')
    , path = require('path')
    , session = require('express-session')
    , passwordless = require('passwordless')
    , store = require('passwordless-mongostore')
    , accountSid = 'TWILIO_SID'         // your twilio account sid
    , authToken = 'TWILIO_AUTH_TOKEN'   // your twilio account auth token
    , twilio = require('twilio')(accountSid, authToken)
    , db = 'mongodb://localhost/passwordless-sms';

passwordless.init(new store(db));
passwordless.addDelivery(function(token, uid, recipient, callback) {
    twilio.messages.create({
        body: token,
        to: recipient,
        from: "TWILIO_NUMBER" // number from your twilio account
    }, function(err, message) {
        callback();
    });
}, {
    tokenAlgorithm: function() {
        // custom token generator
        // short random token generator, enough to fit into single SMS
        return '12345'
    }
});


var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 9000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(session({secret: 'keyboard cat'}));
    app.use(passwordless.sessionSupport());
    app.use(passwordless.acceptToken());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/', passwordless.requestToken(function(user, delivery, callback) {
        // lookup your user from supplied phone number
        // `user` is the value from your html input (by default an input with name = 'user')
        // for this example we're just return the supplied number
        callback(null, user);
    }),
    function (req, res) {
        res.render('verify', { uid: req.passwordless.uidToAuth });
    }
);
app.post('/verify', passwordless.acceptToken({ allowPost: true }), function (req, res) {
    res.redirect('/users');
});
app.get('/users', passwordless.restricted({ failureRedirect: '/' }), user.list);

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
