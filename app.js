const express = require("express");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

const PORT = 3030
const SECRET = 'mysecretsshhh'

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const connection = new Sequelize("authDB", "root", "", {
  host: "localhost",
  dialect: "mysql",
  port: 3333
});

const User = connection.define("user", {
  email: Sequelize.STRING,
  password: Sequelize.STRING
});

connection
  .sync({
    logging: console.log,
    force: true
  })
  .then(() => {
    console.log("Connection success");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch(err => {
    console.log("Connection failed", err); 
});

app.get('/', (req, res) => res.json({connection: 'success'}).status(200));

app.post('/secret', verifyToken,(req,res) => {
    jwt.verify(req.token, SECRET, {expiresIn: '5m'}, (err,authData) => {
        if(err) {
            res.sendStatus(403)
        } else {
            res.send({message: 'It\'s no more secret', authData})
        }
    });
});

app.post('/reg', (req,res) => {
    const u = new User();
    u.email = req.body.email;
    bcrypt.hash(req.body.password, 10, (err,hashPassword) => {
        if(err){
            console.log('Error in hashing passowrd')
        } else {
            u.password = hashPassword
            u.save()
            .then(user => {
                res.send(user).status(200)
            })
            .catch(e => {
                res.json({ error: JSON.stringify(e)}).status(400)
            });
        }
    })
});

app.post('/login', (req,res) => {
    User.findOne({
        where:{
            email: req.body.email    
        }
    })
    .then( u => {
        if(u) {
            bcrypt.compare(req.body.password, u.password)
            .then(data => {
                if(data) {

                    jwt.sign({u},SECRET, (err,token) => {
                        if(err) {
                            res.send({error: 'Error creating token'})
                        }
                        res.json({token})
                    });
                } else {
                    res.send({err: 'Password did\'nt matched.'}).status(200)
                }
            })
            .catch(err => {
                res.json({err: JSON.stringify(err)}).status(200)
            });
        } else {
            res.json({err: 'User not found.'}).status(400)
        }
    })
    .catch(e => {
        res.json({ error: JSON.stringify(e)}).status(400)
    });
});

//Verify token
function verifyToken(req,res,next) {
    const bearerHeader = req.headers['authorization'];
    console.log(bearerHeader)
    if(typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        console.log(req.token)
        next()
    } else {
        res.sendStatus(403)
    }
}