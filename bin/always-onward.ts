#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AlwaysOnwardStack } from '../lib/alwaysOnwardStack';
import { CognitoStack } from '../lib/cognitoStack';
import { LambdaStack } from '../lib/lambdaStack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-west-2'
}

const cog = new CognitoStack(app, "cognito", {
  stackName: 'Always-Onward-lambda-stack',
  env: env
});

const Lambda = new LambdaStack(app, "lambda", {
  stackName: 'Always-Onward-lambda-stack',
  env: env,
});

new AlwaysOnwardStack(app, 'AlwaysOnwardStack', {
  apigw: Lambda.apigw,
  stackName: 'Always-Onward-base-stack',
  env: env,
});
