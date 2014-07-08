var Verify = function(config) {
    this.config = config;

    var redis = require('redis');
    this.client = redis.createClient(this.config.REDIS.PORT, this.config.REDIS.HOSTNAME);
    if (this.config.REDIS.SELECT)
        this.client.select(config.REDIS.SELECT);

    this.Email = require('./Email')(this.config.MANDRILL_API_KEY);
};

/*
inputEmailAddress - email we are confirming
callback - fn(err, res)
additionalObject - additional data to be stored, for example signup date, mailing frequency, etc. 100% developer determined
*/
Verify.prototype.verifyEmail = function(inputEmailAddress, callback, additonalObject) {
    var self = this;
    if (typeof callback !== 'function')
        throw 'Programming error: verifyEmail requires a callback';

    // 1.) Validate email
    if (!self.Email.validate(inputEmailAddress)) {
        return callback({
            'error': 'Email address invalid',
            'stage': 'validation'
        }, null);
    }

    // 2.) Generate confirmation code
    var confirmationCode = generateUniqueToken();

    // 3a.) Insert email + confirmation code into redis if it doesn't already exist
    self.client.sismember('EmailList', inputEmailAddress, function(err, res) {
        if (err)
            return callback({
                'error': 'Database connection error',
                'stage': 'database'
            }, null);
        if (res === 1) { //Email already exists
            return callback({
                'error': 'Email address already exists in system',
                'stage': 'database'
            }, null);
        } else { //Insert new email
            var multi = self.client.multi();
            var obj = {
                'confirmation': confirmationCode,
                'verified': false,
                'signup_time': Date.now()
            };

            if (additonalObject)
                obj.data = additonalObject;
            multi.hmset('Email:' + inputEmailAddress, obj, function(err, res) {

            });
            multi.sadd('EmailList', inputEmailAddress, function(err, res) {});
            multi.exec(function(err, replies) {
                if (err)
                    return callback({
                        'error': 'Database connection error',
                        'stage': 'database'
                    }, null);
                else
                    return sendTheEmail(inputEmailAddress, confirmationCode);
            });
        }
    });

    // 3b.) Send email using Email API with link to verify email
    // Called with a successful redis insert
    function sendTheEmail(inputEmailAddress, confirmationCode) {
        var body_html = self.config.EMAIL.MESSAGE_HTML || '';

        body_html = body_html.replace('%%CONFIRMATION_CODE%%', confirmationCode).replace('%%EMAIL%%', inputEmailAddress);

        self.Email.send({
            to: {
                email: inputEmailAddress
            },
            from: {
                email: self.config.EMAIL.SENDER_EMAIL,
                name: self.config.EMAIL.SENDER_NAME
            },
            subject: self.config.EMAIL.SUBJECT || 'Email confirmation',
            body: {
                html: body_html,
            }
        }, function(err, res) {
            var error = '';
            if (err)
                error = err;

            for (var i = 0; i < res.length; i++) {
                if (res[i].status === 'rejected')
                    error = 'Rejected:' + res[i].reject_reason;
                if (res[i].status === 'invalid')
                    error = 'Invalid';
            }

            if (error !== '') {
                return callback({
                    'error': error,
                    'stage': 'email'
                }, null);
            }
            return callback(null, 'Success');
        });
    }
};

Verify.prototype.unsubscribe = function(email, confirmation, callback) {
    var self = this;
    self.client.sismember("EmailList", email, function(err, res) { //Is specified email on the list?
        if (err)
            return callback(err, null);
        if (res !== 1)
            return callback("Email not found", null);

        self.client.hgetall('Email:' + email, function(err, res) { //Is the provided confirmation code correct?
            if (err)
                return callback(err, null);
            if (confirmation !== res.confirmation) {
                return callback("Invalid confirmation code", null);
            }

            var multi = self.client.multi();
            multi.del('Email:' + email);
            multi.srem('EmailList', email);
            multi.exec(function(err, rep) {
                if (err)
                    return callback(err, null);
                return callback(null, 'Success');
            });
        });
    });
};

function generateUniqueToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

module.exports = function(config) {
    return new Verify(config);
};