
/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', { title: 'Express' });
};

exports.sendSms = function(req, res) {
    res.redirect('/');
};
