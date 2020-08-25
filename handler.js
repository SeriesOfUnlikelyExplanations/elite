const serverless = require("serverless-http");
const express = require("express");
const path = require("path");
var cookie = require('cookie')

const app = express();

app.set('views',path.join(__dirname,"views"))
app.set("view engine","hbs")

app.use( (req, res, next) => {
  res.cookie('sessionid', '1', {httpOnly: true, sameSite: 'none', secure: true});
  next()
})

app.get("/", (req, res) => {
  res.status(200).render("index");
});

app.get("/ranks", (req, res) => {

  res.status(200).render("ranks");
});

app.get("/engineers", (req, res) => {

  res.status(200).render("engineers");
});

app.get("/ships", (req, res) => {

  res.status(200).render("ships");
});

module.exports.always-onward= serverless(app);
