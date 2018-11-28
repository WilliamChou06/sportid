module.exports = (app, passport) => {
  app.get('/', (req, res) => {
    res.render('index.ejs');
  });
  app.get('/signup', (req, res) => {
    res.render('signup.ejs');
  });

  app.post(
    '/signup',
    passport.authenticate('local-signup', {
      successRedirect: '/profile',
      failureRedirect: '/signup',
      failureFlash: true
    })
  );

  app.post(
    '/login',
    passport.authenticate('local-login', {
      successRedirect: '/profile',
      failureRedirect: '/login',
      failureFlash: true
    })
  );

  app.post('/login', () => {});

  app.get('/profile', isLoggedIn, (req, res) => {
    // res.render('profile.ejs', {
    //   user: req.user
    // });
    res.send('done');
  });

  app.get('/logout', () => {
    req.logout();
    res.redirect('/');
  });
};

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/');
};
