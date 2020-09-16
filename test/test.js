var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
var fs = require('fs');


describe("Testing the skill", function() {
  this.timeout(4000);
  describe("Test that the webpage loads and has certain important strings", () => {
    it('test index.hmml', (done) => {
      fs.readFile('./static/index.html', function read(err, data) {
        if (err) {
            throw err;
        }
        var html_string = new TextDecoder("utf-8").decode(data);
        expect(html_string).to.contain('https://auth.always-onward.com');
        done();
      })
    })
  });
});
