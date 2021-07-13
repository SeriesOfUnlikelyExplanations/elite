import * as cdk from '@aws-cdk/core';
import { OriginAccessIdentity } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import * as config from './config';

export class StaticSite extends cdk.Stack {
  public readonly sourceBucket: Bucket;
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Create the static bucket
    this.sourceBucket = new Bucket(this, config.siteNames[0] + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: config.siteNames[0],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    // Create the base cloudfront distribution
    const oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK"
    });
    this.sourceBucket.grantRead(oia);
  }
}
