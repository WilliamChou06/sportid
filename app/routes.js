module.exports = (app, passport) => {
  app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      var googleAuthLink = 'https://sportid6.herokuapp.com/auth/google';
    } else {
      var googleAuthLink = 'http://localhost:8080/auth/google';
    }
    res.render('index.ejs', {
      googleAuthLink
    });
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
      failureRedirect: '/',
      failureFlash: true
    })
  );

  app.post('/login', () => {});

  app.get('/profile', isLoggedIn, (req, res) => {
    // res.render('profile.ejs', {
    //   user: req.user
    // });
    res.render('profile.ejs', {
      user: req.user
    });
  });

  app.get('/logout', () => {
    req.logout();
    res.redirect('/');
  });

  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile']
    })
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/login'
    }),
    (req, res) => {
      res.redirect('/profile');
    }
  );
};

// Might have to put in export

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/');
};
