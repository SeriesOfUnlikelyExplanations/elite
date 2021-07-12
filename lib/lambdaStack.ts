import * as cdk from '@aws-cdk/core';
import * as config from './config';
import * as lambda from "@aws-cdk/aws-lambda";
import * as cognito from "@aws-cdk/aws-cognito";
import * as apigateway from '@aws-cdk/aws-apigateway';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import * as ssm from '@aws-cdk/aws-ssm';
import * as iam from '@aws-cdk/aws-iam';
//~ import console = require('console');

interface myStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
}

export class LambdaStack extends cdk.Stack {
  public readonly apigw: apigateway.LambdaRestApi;
  constructor(scope: cdk.App, id: string, props: myStackProps) {
    super(scope, id, props);

    const { userPool } = props;
    //Create the Lambda
    const handler = new lambda.Function(this, 'alwaysOnwardLambda', {
      functionName: `alwaysOnwardLambda`,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(120),
      runtime: lambda.Runtime.NODEJS_14_X,
      retryAttempts: 0
    });
    handler.addToRolePolicy(new iam.PolicyStatement({
      resources: ['arn:aws:ssm:us-west-2:718523126320:parameter/AlwaysOnward/*'],
      actions: ['ssm:GetParameters'],
    }))

    //create an API gateway to trigger the lambda
    this.apigw = new apigateway.LambdaRestApi(this, "api", {
      handler: handler,
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.NONE
      },
      binaryMediaTypes: ['*/*'],
      proxy: false,
      description: `Simple lambda API service. Timestamp: ${Date.now()}`
    });

    //add cognito authorizer to the Lambda
    const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'alwaysOnwardAuthorizer', {
      cognitoUserPools: [userPool]
    });
    const my_resource = this.apigw.root.addResource("private")
    const post = this.apigw.root.addMethod('ANY', new apigateway.LambdaIntegration(handler), {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: auth
    });
  }
}
