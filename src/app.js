import express from 'express';
import { injetarLocals } from './middlewares/locals.middleware.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import flash from 'connect-flash';
import { router } from '../src/routes/index.js';
import { painelRouter } from '../src/routes/painel.router.js';
import methodOverride from 'method-override';
import { middlewareDeErros } from '../src/middlewares/erros.middlewares.js';


const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride((req) => req.body && req.body._method));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo-dev',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.flash = {
    sucesso: req.flash('sucesso'),
    erro:    req.flash('erro'),
  };
  next();
});

app.use(injetarLocals);

app.use('/api', router);

app.get('/login', (req, res) => res.render('auth/login'));
app.get('/registrar', (req, res) => res.render('auth/registrar'));
app.get('/logout', (req, res) => {
    res.redirect('/login');
});

app.use('/painel', painelRouter);
app.use(middlewareDeErros);

export default app;