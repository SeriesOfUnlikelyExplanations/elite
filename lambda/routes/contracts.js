// route - api/private/contracts

module.exports = (api, opts) => {
  api.get('/logout', async (req,res) => {
    console.log('made it')
    return res.status(200).json({thing:true})
  })
}
