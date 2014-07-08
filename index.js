var config = require('./config');

var Verify = require('./lib/Verification')(config);

var express = require('express');
var app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.send('hello world');
});

app.get('/signup', function(req, res) {
    res.json(400, {
        error: 'Error'
    });
});

app.post('/signup', function(req, res) {
    if (typeof req.body.email === 'undefined') {
        return res.json(400, {
            error: 'No email specified'
        });
    }
    Verify.verifyEmail(req.body.email, function(err, r) {
        if (err)
            return res.json(400, {
                error: err
            });
        return res.json(200, {
            status: 'Success'
        });
    });
});

app.get('/unsubscribe', function(req, res) {
    if (typeof req.query.email === 'undefined' || typeof req.query.confirmation === 'undefined')
        return res.json(400, {
            error: 'Missing parameters'
        });
    Verify.unsubscribe(req.query.email, req.query.confirmation, function(err, r) {
        if (err)
            return res.json(400, {
                error: err
            });
        return res.json(200, {
            status: "success"
        });
    });
});

app.listen(3000);