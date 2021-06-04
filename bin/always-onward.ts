#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AlwaysOnwardStack } from '../lib/alwaysOnwardStack';
import { CognitoStack } from '../lib/cognitoStack';
import { LambdaStack } from '../lib/lambdaStack';

const app = new cdk.App();
const env = { env: {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1'
}}

new AlwaysOnwardStack(app, 'AlwaysOnwardStack', env);

new CognitoStack(app, "cognito", env);

new LambdaStack(app, "lambda", env);
