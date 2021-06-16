import * as cdk from '@aws-cdk/core';
import { CloudFrontWebDistribution, OriginAccessIdentity, CloudFrontAllowedMethods } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as config from './onwardConfig';
import * as cognito from "@aws-cdk/aws-cognito";
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ssm from '@aws-cdk/aws-ssm';
import * as cr from '@aws-cdk/custom-resources'

interface LambdaStackProps extends cdk.StackProps {
  apigw: apigateway.LambdaRestApi;
}

export class AlwaysOnwardStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const {apigw} = props;
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
          s3OriginSource: {
            s3BucketSource: sourceBucket,
            originAccessIdentity: oia
          },
          behaviors : [ {isDefaultBehavior: true}]
        },
        {
          customOriginSource: {
            domainName: `${apigw.restApiId}.execute-api.${this.region}.${this.urlSuffix}`
          },
          originPath: `/${apigw.deploymentStage.stageName}`,
          behaviors: [{
            pathPattern: '/api/*',
            allowedMethods: CloudFrontAllowedMethods.ALL,
            forwardedValues: {
              queryString: true,
              cookies: { forward: 'all'},
              headers: [ "host" ]
            },
          }]
        }
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

    new route53.ARecord(this, config.siteNames[0]  + '-alias-record', {
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: myHostedZone,
      recordName: config.siteNames[0],
    });

    const aRecord = new route53.ARecord(this, config.siteNames[1] + '-alias-record', {
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: myHostedZone,
      recordName: config.siteNames[1],
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: config.siteNames[0],
      selfSignUpEnabled: true, // Allow users to sign up
      autoVerify: { email: true }, // Verify email addresses by sending a verification code
      signInAliases: { email: true }, // Set email as an alias
    });
    userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: config.authName,
      },
    })
    userPool.node.addDependency(aRecord);

    //Setup Domain names
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
    // setup Clients
    const userPoolClient = userPool.addClient('app-client', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [ cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PHONE, cognito.OAuthScope.PROFILE ],
        callbackUrls: config.siteNames.map(i => 'https://' + i).concat(['https://localhost:3000']),
        logoutUrls: config.siteNames.map(i => 'https://' + i),
      },
      generateSecret: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.AMAZON,
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE
      ],
    });
    //Setup Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false, // Don't allow unathenticated users
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });
    // Setup LWA & login with Google
    new cognito.UserPoolIdentityProviderAmazon(this, 'Amazon', {
      clientId: config.LWA_CLIENT_ID,
      clientSecret: config.LWA_CLIENT_SECRET,
      scopes: ['profile'],
      userPool: userPool,
      attributeMapping: {
        email: cognito.ProviderAttribute.AMAZON_EMAIL,
        fullname: cognito.ProviderAttribute.AMAZON_NAME
      },
    });
    new cognito.UserPoolIdentityProviderGoogle(this, 'Google', {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      scopes: ['profile', 'email', 'openid'],
      userPool: userPool,
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        fullname: cognito.ProviderAttribute.GOOGLE_NAME
      },
    });

    //get client secret
    const describeCognitoUserPoolClient = new cr.AwsCustomResource(
      this,
      'DescribeCognitoUserPoolClient',
      {
        resourceType: 'Custom::DescribeCognitoUserPoolClient',
        onCreate: {
          region: config.region,
          service: 'CognitoIdentityServiceProvider',
          action: 'describeUserPoolClient',
          parameters: {
            UserPoolId: userPool.userPoolId,
            ClientId: userPoolClient.userPoolClientId,
          },
          physicalResourceId: cr.PhysicalResourceId.of(userPoolClient.userPoolClientId),
        },
        // TODO: can we restrict this policy more?
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      }
    )
    describeCognitoUserPoolClient.node.addDependency(userPoolClient);
    const userPoolClientSecret = describeCognitoUserPoolClient.getResponseField(
      'UserPoolClient.ClientSecret'
    )

    // Export values
    new ssm.StringParameter(this, 'UserPoolId', {
      parameterName: '/AlwaysOnward/UserPoolId',
      stringValue: `${userPool.userPoolId}`
    });
    new ssm.StringParameter(this, 'UserPoolClientId', {
      parameterName: '/AlwaysOnward/UserPoolClientId',
      stringValue: `${userPoolClient.userPoolClientId}`
    });
    new ssm.StringParameter(this, 'UserPoolClientSecret', {
      parameterName: '/AlwaysOnward/UserPoolClientSecret',
      stringValue: `${userPoolClientSecret}`
    });

    new ssm.StringParameter(this, 'IdentityPoolId', {
      parameterName: '/AlwaysOnward/IdentityPoolId',
      stringValue: `${identityPool.ref}`
    });
    new ssm.StringParameter(this, 'AuthDomain', {
      parameterName: '/AlwaysOnward/AuthDomain',
      stringValue: `${config.authDomain}`
    });
  }
}
