#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AlwaysOnwardStack } from '../lib/alwaysOnwardStack';
import { LambdaStack } from '../lib/lambdaStack';
import { CognitoStack } from '../lib/cognitoStack';
import * as config from '../lib/config';
//~ import console = require('console');

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region
}

const Cognito = new CognitoStack(app, "cognito", {
  stackName: 'Always-Onward-cognito-stack',
  env: env,
});

const Lambda = new LambdaStack(app, "lambda", {
  stackName: 'Always-Onward-lambda-stack',
  env: env,
});

new AlwaysOnwardStack(app, 'AlwaysOnwardStack', {
  apigw: Lambda.apigw,
  handler: Lambda.handler,
  userPool: Cognito.userPool,
  stackName: 'Always-Onward-base-stack',
  env: env,
});
