#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AlwaysOnwardStack } from '../lib/always-onward-stack';

const app = new cdk.App();
new AlwaysOnwardStack(app, 'AlwaysOnwardStack', {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1'
});
