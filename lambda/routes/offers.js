// route - api/private/offers

module.exports = (api, opts) => {
  api.get('/presigned_upload', async (req,res) => {
    const AWS = require('aws-sdk')
    const s3 = new AWS.S3({signatureVersion: 'v4'})
    if (!('filename' in req.query)) {
      return res.status('400').send('Filename is missing')
    }
    const presigned_url = await s3.getSignedUrl('putObject', {
        Bucket: bucket,





        Key: `${req.idTokenPayload.sub}/${req.query.filename}`,
        Expires: 60 * 5 // in seconds
    })
    return res.status(200).send(presigned_url)
  })
}
