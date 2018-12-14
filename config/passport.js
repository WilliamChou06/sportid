const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('../config/keys');

const mysql = require('mysql');

let connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'sportid'
});

connection.connect();

const User = require('../app/models/user');

module.exports = passport => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    connection.query(`SELECT * FROM users WHERE id = ${id}`, (err, rows) => {
      done(err, rows[0]);
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
          connection.query(
            `SELECT * FROM users WHERE email = '${email}'`,
            (err, rows) => {
              if (err) {
                return done(err);
              }

              if (rows.length) {
                return done(null, false, req.flash('error', 'El email ya esta en uso.'));
              } else {
                let newUser = {
                  email,
                  password,
                  nombre: req.body.nombre,
                  apellido: req.body.apellido
                };
                let insertQuery = `INSERT INTO users (email, password, nombre, apellido) VALUES ('${email}', '${password}', '${
                  newUser.nombre
                }', '${newUser.apellido}')`;
                console.log(insertQuery);
                connection.query(insertQuery, (err, rows) => {
                  if (err) {
                    done(err);
                  } else {
                    newUser.id = rows.insertId;
                    return done(null, newUser);
                  }
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
        connection.query(
          `SELECT * FROM users WHERE email = '${email}'`,
          (err, rows) => {
            if (err) {
              return done(err);
            }

            if (!rows.length) {
              return done(
                null,
                false,
                req.flash('error', 'No se ha encontrado el usuario.')
              );
            }

            // if(!rows[0].validPassword(password)) {
            //   return done(null, false, req.flash('loginMessage', 'Contraseña equivocada.'))
            // }

            if (!(rows[0].password == password)) {
              return done(
                null,
                false,
                req.flash('error', 'Oops! Wrong password.')
              );
            }

            return done(null, rows[0]);
          }
        );
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
        connection.query(`SELECT * FROM users WHERE googleID = ${profile.id}`, (err, rows) => {
          if (err) {
            done(err)
          }

          if (!rows.length) {
            let newUser = {
              googleID: profile.id,
              nombre: profile.displayName
            };
            connection.query(`INSERT INTO users (googleID, nombre) VALUES ('${newUser.googleID}', '${newUser.nombre}')`, (err, rows) => {
              if(err) {
                done(err)
              } else {
                newUser.id = rows.insertId;
                return done(null, newUser);
              }
            })
          } else {
            done(null, rows[0]);
          }
        })
      }
    )
  );

  // passport.use(
  //   new GoogleStrategy(
  //     {
  //       clientID: keys.googleClientID,
  //       clientSecret: keys.googleClientSecret,
  //       // callbackURL: '/auth/google/callback'
  //       callbackURL: keys.googleCallbackURL
  //     },
  //     (accessToken, refreshToken, profile, done) => {
  //       User.findOne(
  //         {
  //           'google.id': profile.id
  //         },
  //         (err, user) => {
  //           if (err) {
  //             done(err);
  //           }

  //           if (!user) {
  //             let newUser = new User();
  //             newUser.google.id = profile.id;
  //             newUser.google.name = profile.displayName;
  //             newUser.save(() => {
  //               if (err) {
  //                 throw err;
  //               }

  //               return done(null, newUser);
  //             });
  //           } else {
  //             return done(null, user);
  //           }
  //         }
  //       );
  //     }
  //   )
  // );
};
