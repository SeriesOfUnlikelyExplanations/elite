import * as cdk from '@aws-cdk/core';
import * as config from './onwardConfig';
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigw from '@aws-cdk/aws-apigateway';
import * as ssm from '@aws-cdk/aws-ssm';

export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
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

    //create an API gateway to trigger the lambda
    const apigateway = new apigw.LambdaRestApi(this, "api", {
      handler: handler,
      defaultMethodOptions: {
        // We only do this because Midway authentication is enabled in the Flask app
        authorizationType: apigw.AuthorizationType.NONE
      },
      binaryMediaTypes: ['*/*'],
      description: `Simple lambda API service. Timestamp: ${Date.now()}`
    });

  }
}
