const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const passport = require('passport');
const flash = require('connect-flash');

const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

const configDB = require('./config/database.js');



require('./config/passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

app.use(
  session({
    secret: 'cat66'
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})

app.use(express.static(__dirname + '/public'));


require('./app/routes.js')(app, passport);


app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
