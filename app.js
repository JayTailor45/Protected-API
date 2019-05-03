const express = require("express");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");

const app = express();

const PORT = 3030

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

app.post('/login', (req,res) => {
    const u = new User();
    u.email = req.body.email;
    u.password = req.body.password;
    u.save()
    .then(user => {
        res.send(user).status(200)
    })
    .catch(e => {
        res.json({ error: JSON.stringify(e)}).status(400)
    });
});
