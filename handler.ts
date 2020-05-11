import { APIGatewayProxyHandler, S3CreateEvent, S3Handler } from 'aws-lambda';
import 'source-map-support/register';
import * as S3 from 'aws-sdk/clients/s3';

const sharp = require('sharp');
import { v4 as uuidv4 } from 'uuid';
import { Body, GetObjectOutput, ListObjectsOutput, ListObjectsRequest, PutObjectOutput } from 'aws-sdk/clients/s3';

const s3 = new S3();
const bucketName = '';
const resizedPrefix = 'resized';

export const hello: APIGatewayProxyHandler = async () => {
    const bucket = bucketName;
    const uploadedObjectBody: Body = await getObjectBody(bucket, 'a.jpg');
    const resized = sharp(uploadedObjectBody).resize(400, 400);
    const webpBuffer = await resized.webp().toBuffer();
    const jpgBuffer = await resized.jpeg().toBuffer();
    const uuid: string = uuidv4();

    const key = `resized/${uuid}`;
    await uploadObject(jpgBuffer, `${key}.jpg`, bucket, 'image/jpeg');
    await uploadObject(webpBuffer, `${key}.webp`, bucket, 'image/webp');

    return {
        statusCode: 200,
        body: 'b',
    };
};

export const resizeImages: S3Handler = async (event: S3CreateEvent) => {
    const bucket = event.Records[0].s3.bucket.name;
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const uploadedObjectBody: Body = await getObjectBody(bucket, srcKey);

    const resized = sharp(uploadedObjectBody).resize(400, 400);
    const webpBuffer = await resized.webp().toBuffer();
    const jpgBuffer = await resized.jpeg().toBuffer();
    if (!srcKey.includes('/')) {
        const uuid: string = uuidv4();
        const key = `${resizedPrefix}/${uuid}`;
        await uploadObject(webpBuffer, `${key}.webp`, bucket, 'image/webp');
        await uploadObject(jpgBuffer, `${key}.jpg`, bucket, 'image/jpeg');
    }
};

export const listResized: APIGatewayProxyHandler = async () => {
    const request: ListObjectsRequest = {
        Bucket: bucketName,
        Prefix: resizedPrefix
    };
    const objects: ListObjectsOutput = await s3.listObjects(request).promise();
    const images: string[] = objects.Contents
        .filter(object => object.Key.includes('webp'))
        .map(object => object.Key.split('.')[0].split('/')[1]);

    return {
        statusCode: 200,
        body: JSON.stringify(images),
    };
};

export const listOriginal: APIGatewayProxyHandler = async () => {
    const request: ListObjectsRequest = {
        Bucket: bucketName,
        Delimiter: '/'
    };
    const objects: ListObjectsOutput = await s3.listObjects(request).promise();
    const images: string[] = objects.Contents
        .map(object => object.Key);

    return {
        statusCode: 200,
        body: JSON.stringify(images),
    };
};

export const getObjectBody = async (bucket: string, key: string): Promise<Body> => {
    let getObjectOutput: GetObjectOutput;
    try {
        getObjectOutput = await s3.getObject({
            Bucket: bucket,
            Key: key
        }).promise();
    } catch (e) {
        console.log(e);
    }
    return getObjectOutput.Body;
};

export const uploadObject = async (object: Body, key: string, bucket: string, contentType: string): Promise<void> => {
    try {
        const putObjectOutput: PutObjectOutput = await s3.putObject({
            Bucket: bucket,
            Key: key,
            Body: object,
            ContentType: contentType,
            ACL: 'public-read'
        }).promise();
        console.log(putObjectOutput.ETag);
    } catch (e) {
        console.log(e)
    }
};
