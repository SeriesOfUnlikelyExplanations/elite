import * as cdk from '@aws-cdk/core';
import { OriginAccessIdentity } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess, RedirectProtocol } from '@aws-cdk/aws-s3';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as config from './config';

export class StaticSite extends cdk.Stack {
  public readonly sourceBucket: Bucket;
  public readonly redirectRecord: route53.ARecord
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Create the static bucket
    this.sourceBucket = new Bucket(this, config.siteName + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: config.siteName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    // Create the base cloudfront distribution
    const oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK"
    });
    this.sourceBucket.grantRead(oia);

    const redirectBucket = new Bucket(this, config.rootSiteName + '-website', {
      bucketName: config.rootSiteName,
      websiteRedirect: {hostName: config.siteName, protocol: RedirectProtocol.HTTPS},
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, config.siteName + '-hosted-zone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.zoneName,
    });
    this.redirectRecord = new route53.ARecord(this, 'fake-alias-record', {
      target: route53.RecordTarget.fromAlias(new targets.BucketWebsiteTarget(redirectBucket)),
      zone: myHostedZone,
      recordName: '',
    });
  }
}
