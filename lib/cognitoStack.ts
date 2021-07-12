import * as cdk from '@aws-cdk/core';
import * as config from './config';
import * as cognito from "@aws-cdk/aws-cognito";
import * as ssm from '@aws-cdk/aws-ssm';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cr from '@aws-cdk/custom-resources'
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
//~ import console = require('console');

export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: config.siteNames[0],
      selfSignUpEnabled: true, // Allow users to sign up
      autoVerify: { email: true }, // Verify email addresses by sending a verification code
      signInAliases: { email: true }, // Set email as an alias
    });
    //~ this.userPool.addDomain('CognitoDomain', {
      //~ cognitoDomain: {
        //~ domainPrefix: config.authName,
      //~ },
    //~ })

    // setup Clients
    const userPoolClient = this.userPool.addClient('app-client', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [ cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PHONE, cognito.OAuthScope.PROFILE ],
        callbackUrls: config.siteNames.concat(['localhost:3000']).map(i => `https://${i}/api/auth/callback`),
        logoutUrls: config.siteNames.map(i => 'https://' + i).concat(['https://localhost:3000']),
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
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });
    // Setup LWA & login with Google
    new cognito.UserPoolIdentityProviderAmazon(this, 'Amazon', {
      clientId: config.LWA_CLIENT_ID,
      clientSecret: config.LWA_CLIENT_SECRET,
      scopes: ['profile'],
      userPool: this.userPool,
      attributeMapping: {
        email: cognito.ProviderAttribute.AMAZON_EMAIL,
        fullname: cognito.ProviderAttribute.AMAZON_NAME
      },
    });
    new cognito.UserPoolIdentityProviderGoogle(this, 'Google', {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      scopes: ['profile', 'email', 'openid'],
      userPool: this.userPool,
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
            UserPoolId: this.userPool.userPoolId,
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
    //Setup Cognito Domain names
    const domainCert = acm.Certificate.fromCertificateArn(this, 'domainCert', config.certificateArn);
    const userPoolDomain = this.userPool.addDomain('CustomDomain', {
      customDomain: {
        domainName: config.authDomain,
        certificate: domainCert,
      },
    });
    const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, config.siteNames[0] + '-hosted-zone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.zoneName,
    });
    new route53.ARecord(this, config.authDomain + '-alias-record', {
     target: route53.RecordTarget.fromAlias(new targets.UserPoolDomainTarget(userPoolDomain)),
      zone: myHostedZone,
      recordName: config.authDomain,
    });

    describeCognitoUserPoolClient.node.addDependency(userPoolClient);
    const userPoolClientSecret = describeCognitoUserPoolClient.getResponseField(
      'UserPoolClient.ClientSecret'
    )
    // Export values
    new ssm.StringParameter(this, 'UserPoolId', {
      parameterName: '/AlwaysOnward/UserPoolId',
      stringValue: `${this.userPool.userPoolId}`
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
