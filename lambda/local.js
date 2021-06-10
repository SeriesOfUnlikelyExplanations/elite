// route - api
module.exports = (api, opts) => {
  api.get('*', async (req,res) => {
    console.log(req.path);
    return { path: 'test'}
  })
}
