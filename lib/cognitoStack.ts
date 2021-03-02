import cdk = require('@aws-cdk/core');
import * as cognito from "@aws-cdk/aws-cognito";
import route53 = require('@aws-cdk/aws-route53');
import targets = require('@aws-cdk/aws-route53-targets');
import * as config from './onwardConfig';
import * as acm from '@aws-cdk/aws-certificatemanager';

export class CognitoStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //Create User Pool
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
    //Setup Domain names
    const domainCert = acm.Certificate.fromCertificateArn(this, 'domainCert', config.certificateArn);
    const userPoolDomain = userPool.addDomain('CustomDomain', {
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
    // setup Clients
    const userPoolClient = userPool.addClient('app-client', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [ cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PHONE, cognito.OAuthScope.PROFILE ],
        callbackUrls: config.subSites.map(i => 'https://' + i),
        logoutUrls: config.siteNames.map(i => 'https://' + i),
      }
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
      userPool: userPool,
      attributeMapping: {
        email: cognito.ProviderAttribute.AMAZON_EMAIL,
        fullname: cognito.ProviderAttribute.AMAZON_NAME
      },
    });
    new cognito.UserPoolIdentityProviderGoogle(this, 'Google', {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      userPool: userPool,
      attributeMapping: {
        email: cognito.ProviderAttribute.AMAZON_EMAIL,
        fullname: cognito.ProviderAttribute.AMAZON_NAME
      },
    });
    // Export values
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: identityPool.ref,
    });
  }
}
