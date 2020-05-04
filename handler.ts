import { APIGatewayProxyHandler, S3CreateEvent, S3Handler } from 'aws-lambda';
import 'source-map-support/register';
import * as S3 from 'aws-sdk/clients/s3';

const sharp = require('sharp');
import { v4 as uuidv4 } from 'uuid';
import { GetObjectOutput, PutObjectOutput } from 'aws-sdk/clients/s3';

const s3 = new S3();

export const hello: APIGatewayProxyHandler = async () => {
    return {
        statusCode: 200,
        body: 'a',
    };
};

export const createThumbnails: S3Handler = async (event: S3CreateEvent) => {
    const bucket = event.Records[0].s3.bucket.name;
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    console.log(bucket);
    console.log(srcKey);
    let getObjectOutput: GetObjectOutput;
    try {
        getObjectOutput = await s3.getObject({
            Bucket: bucket,
            Key: srcKey
        }).promise();
    } catch (e) {
        console.log(e);
    }

    const resized = await sharp(getObjectOutput.Body).resize(100, 100).png().toBuffer();
    if (!srcKey.includes('/')) {
        try {
            const key = `rotated/${uuidv4()}`;
            const putObjectOutput: PutObjectOutput = await s3.putObject({
                Bucket: bucket,
                Key: key,
                Body: resized,
                ContentType: 'image/png'
            }).promise();
            console.log('uploaded', key);
            console.log(putObjectOutput.ETag);
        } catch (e) {
            console.log(e);
        }
    }
    console.log('finished');
};
