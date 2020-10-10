# always-onward


https://www.serverlessops.io/blog/static-websites-on-aws-s3-with-serverless-framework
https://github.com/tmclaugh/serverless-zombo.com/blob/master/serverless.yml

ToDo:
- build out the about page
- build out the contact us page
- Stand up rental manager. Login has redirect URL link to there

Deployment requirements:

In the Cognito Dashboard, select the User Pool and follow the steps below:
    Select "App client settings", enable Cognito User Pool as a provider and enter the callback and sign out URLs. Select "Implicit grant" as allowed OAuth flow and tick all the scopes
    Select "Domain name" and create one

https://medium.com/@Da_vidgf/using-cognito-for-users-management-in-your-serverless-application-1695fec9e225
https://gist.github.com/jamesthomasonjr/d63a4fe6d53938e3f97e6039b4a19605
