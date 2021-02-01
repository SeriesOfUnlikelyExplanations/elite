import cdk = require('@aws-cdk/core');
import { CloudFrontWebDistribution, OriginAccessIdentity } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import route53 = require('@aws-cdk/aws-route53');
import targets = require('@aws-cdk/aws-route53-targets');
import { AutoDeleteBucket } from '@mobileposse/auto-delete-bucket'

const websiteDistSourcePath = './static';
const certificateArn = 'arn:aws:acm:us-east-1:718523126320:certificate/a9162037-75f4-4b4f-89dc-185e84007de6';
const hostedZoneId = 'Z0092175EW0ABPS51GQB';
const siteName = 'www.always-onward.com';
const zoneName = 'always-onward.com';

export class AlwaysOnwardStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucket = new AutoDeleteBucket(this, siteName + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: siteName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK"
    });
    sourceBucket.grantRead(oia);

    const distribution = new CloudFrontWebDistribution(this, siteName + '-cfront', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: sourceBucket,
            originAccessIdentity: oia
          },
          behaviors : [ {isDefaultBehavior: true}]
        }
      ],
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [siteName]
      }
    });

    new BucketDeployment(this, siteName + 'DeployWebsite', {
      sources: [Source.asset(websiteDistSourcePath)],
      destinationBucket: sourceBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, siteName + '-hosted-zone', {
      hostedZoneId,
      zoneName,
    });

    const aliasRecord = new route53.ARecord(this, siteName + '-alias-record', {
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: myHostedZone,
      recordName: siteName,
    });
  }
}
