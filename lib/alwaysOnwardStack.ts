import * as cdk from '@aws-cdk/core';
import { CloudFrontWebDistribution, OriginAccessIdentity, CloudFrontAllowedMethods } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import * as cognito from "@aws-cdk/aws-cognito";
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as config from './config';

interface myStackProps extends cdk.StackProps {
  apigw: apigateway.LambdaRestApi;
  userPool: cognito.UserPool;
}

export class AlwaysOnwardStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: myStackProps) {
    super(scope, id, props);

    const {userPool, apigw} = props;
    // Create the static bucket
    const sourceBucket = new Bucket(this, config.siteNames[0] + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: config.siteNames[0],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    // Create the base cloudfront distribution
    const oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK"
    });
    sourceBucket.grantRead(oia);
    const distribution = new CloudFrontWebDistribution(this, config.siteNames[0] + '-cfront', {
      originConfigs: [
        {
          customOriginSource: {
            domainName: `${apigw.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
            //~ originProtocolPolicy: cf.OriginProtocolPolicy.MATCH_VIEWER
          },
          originPath: `/${apigw.deploymentStage.stageName}`,
          behaviors: [{
            pathPattern: '/api/*',
            allowedMethods: CloudFrontAllowedMethods.ALL,
            forwardedValues: {
              queryString: true,
              cookies: { forward: 'all'},
              headers: [ "Referer" ]
            },
          }]
        },
        {
          s3OriginSource: {
            s3BucketSource: sourceBucket,
            originAccessIdentity: oia
          },
          behaviors : [ {isDefaultBehavior: true}]
        },
      ],
      aliasConfiguration: {
        acmCertRef: config.certificateArn,
        names: config.siteNames
      }
    });

    new BucketDeployment(this, config.siteNames[0] + 'DeployWebsite', {
      sources: [Source.asset(config.websiteDistSourcePath)],
      destinationBucket: sourceBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, config.siteNames[0] + '-hosted-zone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.zoneName,
    });
    config.siteNames.forEach((siteNames) => {
      new route53.ARecord(this, siteNames + '-alias-record', {
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
        zone: myHostedZone,
        recordName: config.siteNames[0],
      });
    })
    //Setup Cognito Domain names
    userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: config.authName,
      },
    })
    const domainCert = acm.Certificate.fromCertificateArn(this, 'domainCert', config.certificateArn);
    const userPoolDomain = userPool.addDomain('CustomDomain', {
      customDomain: {
        domainName: config.authDomain,
        certificate: domainCert,
      },
    });
    new route53.ARecord(this, config.authDomain + '-alias-record', {
     target: route53.RecordTarget.fromAlias(new targets.UserPoolDomainTarget(userPoolDomain)),
      zone: myHostedZone,
      recordName: config.authDomain,
    });
  }
}
