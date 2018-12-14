const moment = require('moment');
const mysql = require('mysql');

let connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'sportid'
});

connection.connect();

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
      successRedirect: '/',
      failureRedirect: '/signup',
      failureFlash: true
    })
  );

  app.post(
    '/login',
    passport.authenticate('local-login', {
      successRedirect: `/profile`,
      failureRedirect: '/',
      failureFlash: true
    })
  );

  app.get('/profile/:id', isLoggedIn, (req, res) => {
    connection.query(
      `SELECT * FROM users WHERE id=${req.params.id}`,
      (err, rows) => {
        if (err) {
          console.log(err);
        }

        if (!rows.length) {
          req.flash('error', 'No hay un perfil con ese ID');
        } else {
          res.render('profile.ejs', {
            user: rows[0]
          });
        }
      }
    );
  });

  app.get('/profile', isLoggedIn, (req, res) => {
    let age = moment().diff(req.user.fecha_nac, 'years');
    let fecha_nac;
    if(req.user.fecha_nac) {
      fecha_nac = moment(req.user.fecha_nac).format('YYYY/MM/DD');
    }
    if(!req.user.fecha_nac) {
      fecha_nac = ''
    }
    console.log(age);
    res.render('profile.ejs', {
      user: req.user,
      fecha_nac
    });
  });

  app.get('/profile/:id/edit', isLoggedIn, isAuthorized, (req, res) => {
    res.render('edit.ejs', {
      user: req.user,
      fecha_nac: moment(req.user.fecha_nac).format('YYYY-MM-DD')
    });
  });

  app.post('/profile/:id/edit', isLoggedIn, isAuthorized, (req, res) => {
    let fecha_nac = moment(req.body.fecha_nac).utc().format('YYYY-MM-DD HH:mm:ss');
    connection.query(
      `UPDATE users SET nombre = '${req.body.nombre}', celular = '${
        req.body.celular
      }', club_triatlon = '${req.body.club_triatlon}', sexo = '${req.body.sexo}', fecha_nac = '${fecha_nac}', apellido = '${req.body.apellido}', nro_documento = '${req.body.documento}', alergias = '${req.body.alergias}', seguro_salud = '${req.body.seguro_salud}', contacto_emerg_nombre = '${req.body.contacto_emerg_nombre}', contacto_emerg_numero = '${req.body.contacto_emerg_numero}', pais_nac = '${req.body.pais_nac}', tipo_sangre = '${req.body.tipo_sangre}'
      WHERE id = ${req.params.id}`,
      (err, rows) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect('/profile');
        }
      }
    );
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

const isAuthorized = (req, res, next) => {
  if (
    connection.query(
      `SELECT * FROM users WHERE id=${req.user.id} AND user_type = 'admin'`
    )
  ) {
    return next();
  }

  if (req.params.id == req.user.id) {
    return next();
  }
  req.flash(
    'error',
    'No estas autorizado para editar este perfil.'
  );
  res.redirect('/profile');
};
