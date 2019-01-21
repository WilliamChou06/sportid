const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('../config/keys');

const mysql = require('mysql');

// let connection = mysql.createConnection({
//   host: 'msc-group.com',
//   user: 'mscgroup_creando',
//   password: 'monito75320210',
//   database: 'mscgroup_creandonode'
// });

let db_config = {
  host: process.env.CONNECTION_HOST,
  user: process.env.CONNECTION_USER,
  password: process.env.CONNECTION_PASSWORD,
  database: 'mscgroup_creandonode'
};

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
  // the old one cannot be reused.

  connection.connect(function(err) {
    // The server is either down
    if (err) {
      // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else {
      // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

handleDisconnect();

var del = connection._protocol._delegateError;
connection._protocol._delegateError = function(err, sequence) {
  if (err.fatal) {
    console.trace('fatal error: ' + err.message);
  }
  return del.call(this, err, sequence);
};

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

// const User = require('../app/models/user');

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
                return done(
                  null,
                  false,
                  req.flash('error', 'El email ya esta en uso.')
                );
              } else {
                let newUser = {
                  email,
                  password,
                  nombre: req.body.nombre,
                  apellidos: req.body.apellido
                };
                let insertQuery = `INSERT INTO users (email, password, nombre, apellidos) VALUES ('${email}', '${password}', '${
                  newUser.nombre
                }', '${newUser.apellidos}')`;
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
                req.flash('error', 'Contraseña equivocada')
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
        connection.query(
          `SELECT * FROM users WHERE googleID = ${profile.id}`,
          (err, rows) => {
            if (err) {
              done(err);
            }

            if (!rows.length) {
              let newUser = {
                googleID: profile.id,
                nombre: profile.displayName,
                email: profile.emails[0].value
              };
              connection.query(
                `INSERT INTO users (googleID, nombre, email) VALUES ('${
                  newUser.googleID
                }', '${newUser.nombre}', '${newUser.email}')`,
                (err, rows) => {
                  if (err) {
                    done(err);
                  } else {
                    newUser.id = rows.insertId;
                    return done(null, newUser);
                  }
                }
              );
            } else {
              done(null, rows[0]);
            }
          }
        );
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
