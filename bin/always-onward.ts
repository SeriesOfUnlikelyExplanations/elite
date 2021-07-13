#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AlwaysOnwardStack } from '../lib/alwaysOnwardStack';
import { LambdaStack } from '../lib/lambdaStack';
import { CognitoStack } from '../lib/cognitoStack';
import { StaticSite } from '../lib/staticSiteStack';
import * as config from '../lib/config';
//~ import console = require('console');

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region
}

const staticSite = new StaticSite(app, 'staticSite', {
  stackName: 'always-onward-staticSite-stack',
  env: env,
});

const Cognito = new CognitoStack(app, "cognito", {
  redirectRecord: staticSite.redirectRecord,
  stackName: 'always-onward-cognito-stack',
  env: env,
});

const Lambda = new LambdaStack(app, "lambda", {
  userPool: Cognito.userPool,
  stackName: 'Always-Onward-lambda-stack',
  env: env,
});

new AlwaysOnwardStack(app, 'cloudfront', {
  apigw: Lambda.apigw,
  userPool: Cognito.userPool,
  oia: staticSite.oia,
  sourceBucket: staticSite.sourceBucket,
  stackName: 'Always-Onward-cloudfront-stack',
  env: env,
});
