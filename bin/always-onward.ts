#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AlwaysOnwardStack } from '../lib/alwaysOnwardStack';
import { CognitoStack } from '../lib/cognitoStack';

const app = new cdk.App();
new AlwaysOnwardStack(app, 'AlwaysOnwardStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  }
});

new CognitoStack(app, "cognito");
