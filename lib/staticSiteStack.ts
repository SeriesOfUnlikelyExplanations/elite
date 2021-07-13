import * as cdk from '@aws-cdk/core';
import { OriginAccessIdentity, CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess, RedirectProtocol } from '@aws-cdk/aws-s3';
import { HostedZone, ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import * as config from './config';

export class StaticSite extends cdk.Stack {
  public readonly sourceBucket: Bucket;
  public readonly redirectRecord: ARecord;
  public readonly oia: OriginAccessIdentity;
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
    this.oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK"
    });
    this.sourceBucket.grantRead(this.oia);

    const redirectBucket = new Bucket(this, config.rootSiteName + '-website', {
      bucketName: config.rootSiteName,
      websiteRedirect: {hostName: config.siteName, protocol: RedirectProtocol.HTTPS},
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const distribution = new CloudFrontWebDistribution(this, config.rootSiteName + '-cfront', {
      originConfigs: [{
        customOriginSource: {
          domainName: redirectBucket.bucketWebsiteDomainName,
          //~ originProtocolPolicy: cf.OriginProtocolPolicy.MATCH_VIEWER
        },
        behaviors : [ {isDefaultBehavior: true}]
      }],
      aliasConfiguration: {
        acmCertRef: config.certificateArn,
        names: [config.rootSiteName]
      }
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
