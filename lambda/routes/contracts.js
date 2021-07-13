// route - api/private/contracts

module.exports = (api, opts) => {
  api.get('/logout', async (req,res) => {
    return res.status(200).json({thing:true})
  })
}
