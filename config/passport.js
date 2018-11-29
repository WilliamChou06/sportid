const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('../config/keys');

const User = require('../app/models/user');

module.exports = passport => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

  // LOCAL SIGN UP

  passport.use(
    'local-signup',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      (req, email, password, done) => {
        process.nextTick(() => {
          User.findOne(
            {
              'local.email': email
            },
            (err, user) => {
              if (err) {
                return done(err);
              }

              if (user) {
                return done(
                  null,
                  false,
                  req.flash('signupMessage', 'That email is already taken')
                );
              } else {
                let newUser = new User();
                newUser.local.email = email;
                newUser.local.password = newUser.generateHash(password);
                newUser.local.name = req.body.name;
                newUser.local.phoneNumber = req.body.phoneNumber;

                newUser.save(err => {
                  if (err) {
                    throw err;
                  }

                  return done(null, newUser);
                });
              }
            }
          );
        });
      }
    )
  );

  passport.use(
    'local-login',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      (req, email, password, done) => {
        User.findOne({ 'local.email': email }, (err, user) => {
          if (err) {
            return done(err);
          }

          if (!user) {
            return done(
              null,
              false,
              req.flash(
                'loginMessage',
                'No hay ningún usuario registrado con este email'
              )
            );
          }

          if (!user.validPassword(password)) {
            return done(
              null,
              false,
              req.flash('loginMessage', 'Contraseña equivocada')
            );
          }

          return done(null, user);
        });
      }
    )
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: keys.googleClientID,
        clientSecret: keys.googleClientSecret,
        // callbackURL: '/auth/google/callback'
        callbackURL: keys.googleCallbackURL
      },
      (accessToken, refreshToken, profile, done) => {
        User.findOne(
          {
            'google.id': profile.id
          },
          (err, user) => {
            if (err) {
              done(err);
            }

            if (!user) {
              let newUser = new User();
              newUser.google.id = profile.id;
              newUser.google.name = profile.displayName;
              newUser.save(() => {
                if (err) {
                  throw err;
                }

                return done(null, newUser);
              });
            } else {
              return done(null, user);
            }
          }
        );
      }
    )
  );
};
