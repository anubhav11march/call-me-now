var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const requestIp = require('request-ip');
const useragent = require('express-useragent');

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
const db = require('./db');
const { debugPort } = require('process');

var app = express();
const PORT = 5001;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(useragent.express());
app.use(requestIp.mw());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

setInterval(function () {
    function compare(a, b) {
        var x = new Date(a.created_at).getTime();
        var y = new Date(b.created_at).getTime();
        if (x > y) {
            return -1;
        }
        if (x < y) {
            return 1;
        }
        return 0;
    }
    try {
        const analytics = db.get('analytics').value();
        analytics.sort(compare);
        var len = analytics.length;
        if (len > 3000) {
            for (var i = 3000; i < len; i++) {
                db.get('analytics').remove({ id: analytics[i].id }).write();
            }
        } else {
            console.log('Less than 20');
        }
    } catch {
        console.log('Error');
    }
}, 1 * 60 * 60 * 1000);

app.listen(PORT, () => console.log(`running ${PORT}`));
//module.exports = app;
