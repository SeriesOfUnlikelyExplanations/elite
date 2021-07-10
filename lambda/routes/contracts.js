var { httpRequest, getConfig, checkAuth } = require('../components');

module.exports = (api, opts) => {
  api.get('/upload_contracts', checkAuth, async (req,res) => {
    return res.status(200).json('{"success":"true"')
  })
}
