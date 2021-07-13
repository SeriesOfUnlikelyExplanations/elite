import * as cdk from '@aws-cdk/core';
import { OriginAccessIdentity, Distribution } from '@aws-cdk/aws-cloudfront'
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { Bucket, BlockPublicAccess, RedirectProtocol } from '@aws-cdk/aws-s3';
import { HostedZone, ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import * as config from './config';

export class StaticSite extends cdk.Stack {
  public readonly sourceBucket: Bucket;
  public readonly redirectRecord: ARecord;
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Create the static bucket
    this.sourceBucket = new Bucket(this, config.siteName + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: config.siteName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const redirectBucket = new Bucket(this, config.rootSiteName + '-website', {
      bucketName: config.rootSiteName,
      websiteRedirect: {hostName: config.siteName, protocol: RedirectProtocol.HTTPS},
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const distribution = new Distribution(this, config.rootSiteName + '-cfront', {
      defaultBehavior: { origin: new origins.S3Origin(redirectBucket) },
      certificate: Certificate.fromCertificateArn(this, 'Certificate', config.certificateArn),
      domainNames: [config.rootSiteName]
    });

    const myHostedZone = HostedZone.fromHostedZoneAttributes(this, config.siteName + '-hosted-zone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.rootSiteName,
    });
    this.redirectRecord = new ARecord(this, 'fake-alias-record', {
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: myHostedZone,
      recordName: '',
    });
  }
}
