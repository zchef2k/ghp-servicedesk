# OAuth Token Exchange Lambda

This function exchanges a GitHub OAuth `code` for an access token. It's the
only server-side piece of the app, needed because GitHub Pages can't hold the
OAuth App's client secret.

## Deploy (AWS CLI)

1. **Create the GitHub OAuth App** (see main [README](../README.md)) and note
   the client ID and secret.

2. **Zip the function**:

   ```sh
   cd lambda
   zip function.zip index.mjs
   ```

3. **Create the Lambda function** (one-time):

   ```sh
   aws lambda create-function \
     --function-name ghp-servicedesk-oauth \
     --runtime nodejs20.x \
     --handler index.handler \
     --zip-file fileb://function.zip \
     --role <your-lambda-execution-role-arn> \
     --environment "Variables={GITHUB_CLIENT_ID=<client-id>,GITHUB_CLIENT_SECRET=<client-secret>}"
   ```

   The execution role only needs the basic `AWSLambdaBasicExecutionRole`
   (CloudWatch Logs) — no other AWS permissions are required.

4. **Create a Function URL** with no auth. CORS is handled entirely by this
   Function URL configuration — the function code itself does not set any
   `Access-Control-*` headers (setting them in both places causes duplicate
   headers, which browsers reject):

   ```sh
   aws lambda create-function-url-config \
     --function-name ghp-servicedesk-oauth \
     --auth-type NONE \
     --cors '{"AllowOrigins":["https://<username>.github.io"],"AllowMethods":["POST"],"AllowHeaders":["Content-Type"]}'

   aws lambda add-permission \
     --function-name ghp-servicedesk-oauth \
     --action lambda:InvokeFunctionUrl \
     --statement-id PublicInvoke \
     --principal "*" \
     --function-url-auth-type NONE
   ```

5. Copy the resulting Function URL into `src/lib/config.ts` as
   `tokenExchangeUrl`.

## Updating the function

```sh
cd lambda
zip function.zip index.mjs
aws lambda update-function-code --function-name ghp-servicedesk-oauth --zip-file fileb://function.zip
```
