import dotenv from "dotenv";
import fs;

export var websiteDistSourcePath = './static';
export var certificateArn = 'arn:aws:acm:us-east-1:718523126320:certificate/759a286c-c57f-44b4-a40f-4c864a8ab447';
export var hostedZoneId = 'Z0092175EW0ABPS51GQB';
export var siteNames = ['www.always-onward.com','always-onward.com'];
export var subSites = ['photos.always-onward.com']
export var zoneName = 'always-onward.com';
export var authDomain = 'auth.always-onward.com'
export var authName = 'auth-onward'

if (fs.existsSync(".env")) {
    console.log("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
} else {
    console.log("Failed to load");
}

export var LWA_CLIENT_ID = process.env.LWA_CLIENT_ID;
export var LWA_CLIENT_SECRET = process.env.LWA_CLIENT_SECRET;
