const moment = require('moment');
const mysql = require('mysql');
const keys = require('../config/keys');

let connection = mysql.createConnection({
  host: 'msc-group.com',
  user: 'mscgroup_creando',
  password: '',
  database: 'mscgroup_creandonode'
});

connection.connect();

const multer = require('multer');
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function(req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter });

const cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'williamcwd',
  // api_key: process.env.CLOUDINARY_API_KEY,
  // api_secret: process.env.CLOUDINARY_API_SECRET
  api_key: keys.cloudinaryApiKey,
  api_secret: keys.cloudinaryApiSecret
});

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

  app.post('/profile', isLoggedIn, upload.single('image'), (req, res) => {
    cloudinary.uploader.upload(req.file.path, result => {
      console.log(result.secure_url, req.user.id);
      connection.query(
        `UPDATE users SET avatar_link = '${result.secure_url}' WHERE id=${
          req.user.id
        }`,
        (err, rows) => {
          if (err) {
            console.log(err);
            req.flash('error', 'Ha ocurrido un error');
            res.redirect('/profile');
          } else {
            res.redirect('/profile');
          }
        }
      );
    });
  });

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
    let fecha_nac;
    let categoria_atrisc;
    if (req.user.fecha_nac && req.user.fecha_nac !== 'Invalid date') {
      fecha_nac = moment(req.user.fecha_nac).format('YYYY/MM/DD');
    }
    if (!req.user.fecha_nac || req.user.fecha_nac == 'Invalid date') {
      fecha_nac = '';
    }
    let calendarAge = moment('01-01-2019', 'DD-MM-YYYY')
      .endOf('year')
      .diff(fecha_nac, 'years', true);
    console.log(calendarAge);
    if (calendarAge < 7) {
      categoria_atrisc = 'Preinfantiles';
    } else if (calendarAge < 9) {
      categoria_atrisc = 'Infantil A';
    } else if (calendarAge < 11) {
      categoria_atrisc = 'Infantil B';
    } else if (calendarAge < 13) {
      categoria_atrisc = 'Infantil C';
    } else if (calendarAge < 15) {
      categoria_atrisc = 'Infantil D';
    } else if (calendarAge < 17) {
      categoria_atrisc = 'Menores';
    } else if (calendarAge < 21) {
      categoria_atrisc = 'Junior';
    } else if (calendarAge < 25) {
      categoria_atrisc = 'Juvenil';
    } else if (calendarAge < 30) {
      categoria_atrisc = 'Mayores';
    } else if (calendarAge < 35) {
      categoria_atrisc = 'Master A';
    } else if (calendarAge < 40) {
      categoria_atrisc = 'Master B';
    } else if (calendarAge < 45) {
      categoria_atrisc = 'Master C';
    } else if (calendarAge < 50) {
      categoria_atrisc = 'Master D';
    } else if (calendarAge < 55) {
      categoria_atrisc = 'Master E';
    } else if (calendarAge < 60) {
      categoria_atrisc = 'Master F';
    } else if (calendarAge >= 60) {
      categoria_atrisc = 'Master G';
    } else {
      categoria_atrisc = '';
    }

    connection.query(
      `UPDATE users SET categoria_atrisc = '${categoria_atrisc}' WHERE id=${
        req.user.id
      }`
    );
    res.render('profile.ejs', {
      user: req.user,
      fecha_nac,
      categoria_atrisc
    });
  });

  app.get('/profile/:id/edit', isLoggedIn, isAuthorized, (req, res) => {
    res.render('edit.ejs', {
      user: req.user,
      fecha_nac: moment(req.user.fecha_nac).format('YYYY-MM-DD')
    });
  });

  app.post('/profile/:id/edit', isLoggedIn, isAuthorized, (req, res) => {
    let fecha_nac = moment(req.body.fecha_nac)
      .utc()
      .format('YYYY-MM-DD HH:mm:ss');
    connection.query(
      `UPDATE users SET nombre = '${req.body.nombre}', celular = '${
        req.body.celular
      }', club_triatlon = '${req.body.club_triatlon}', sexo = '${
        req.body.sexo
      }', fecha_nac = '${fecha_nac}', apellidos = '${
        req.body.apellido
      }', nro_documento = '${req.body.documento}', alergias = '${
        req.body.alergias
      }', seguro_salud = '${req.body.seguro_salud}', contacto_emerg_nombre = '${
        req.body.contacto_emerg_nombre
      }', contacto_emerg_numero = '${
        req.body.contacto_emerg_numero
      }', pais_nac = '${req.body.pais_nac}', tipo_sangre = '${
        req.body.tipo_sangre
      }', ciudad_residencia = '${req.body.ciudad_residencia}'
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

  app.get('/clubadmin', isClubAdmin, (req, res) => {
    connection.query(`SELECT * FROM users WHERE club_triatlon = '${req.user.club_triatlon}' `, (err, rows) => {
      if(err) {
        req.flash('error', 'Ha ocurrido un error.');
      } else {
        console.log(rows);
        res.render('clubAdmin', {
          user: req.user,
          members: rows
        })      }
    })
  })

  app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Has salido de la sesión exitosamente.');
    res.redirect('/');
  });

  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email']
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
  req.flash('error', 'No estas autorizado para editar este perfil.');
  res.redirect('/profile');
};

const isClubAdmin = (req, res, next) => {
    connection.query(
      `SELECT * FROM users WHERE id=${req.user.id} AND user_type = 'admin_club'`, (err, rows) =>{
        if( err ) {
          return req.flash('error', 'Ha ocurrido un error');
        }
        if(rows.length > 0) {
          return next();
        }
        else {
          req.flash('error', 'No estas autorizado para entrar a esta página.');
          res.redirect('/profile');
        }
      }
    )
  
};

