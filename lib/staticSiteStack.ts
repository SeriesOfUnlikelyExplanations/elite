import * as cdk from '@aws-cdk/core';
import { OriginAccessIdentity } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { alias } from '@aws-cdk/aws-route53-targets';
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

    const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, config.siteNames[0] + '-hosted-zone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.zoneName,
    });
    new route53.ARecord(this, 'fake-alias-record', {
      target: route53.RecordTarget.fromAlias(new alias.BucketWebsiteTarget(this.sourceBucket)),
      zone: myHostedZone,
      recordName: config.siteNames[0],
    });
  }
}
