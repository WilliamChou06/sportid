module.exports = {
  googleClientID: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectDomain: process.env.REDIRECT_DOMAIN,
  googleCallbackURL: 'https://sportid6.herokuapp.com/auth/google/callback',
  // googleCallbackURL: 'http://creando-nodejs.com/auth/google/callback',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET
};