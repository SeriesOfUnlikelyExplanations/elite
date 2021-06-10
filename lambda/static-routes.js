// route - *
// to serve static files
const fs = require('fs')
const path = require('path')

var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

module.exports = (api, opts) => {
  api.get('*', async (req,res) => {
    var file = path.join(__dirname, '../', '/static', req.path.replace(/\/$/, '/index.html'))
    var type = mime[path.extname(file).slice(1)] || 'text/plain';
    try {
      res.status(200);
      res.type(type);
      if (['image/gif','image/jpeg','image/png'].indexOf(type) > -1) {
        res.sendFile(file)
        return
      } else {
        const data = fs.readFileSync(file)
        return data.toString()
      }
    } catch (err) {
      console.log(err);
      res.status(404)
      res.type('text/plain');
      return 'File not found';
    }
  })
}
