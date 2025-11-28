import CryptoJS from 'crypto-js';
import * as qiniu from 'qiniu-js';
import { QiniuConfig } from '../types';

// Helper for Base64 URL Safe Encoding
const urlSafeBase64Encode = (word: any) => {
  let encoded = CryptoJS.enc.Base64.stringify(word);
  return encoded.replace(/\+/g, '-').replace(/\//g, '_');
};

/**
 * Generate Qiniu Upload Token locally
 * Note: In a production environment with a backend, this should be done server-side.
 * Since this is a serverless, static, password-protected personal tool, we generate it here.
 */
const genUpToken = (config: QiniuConfig): string => {
  const { accessKey, secretKey, bucket, filename } = config;
  
  // 1. Construct Put Policy
  // Allow overwriting the file by specifying scope as bucket:key
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiration
  const putPolicy = {
    scope: `${bucket}:${filename}`,
    deadline: deadline,
  };

  // 2. Encode Policy
  const putPolicyStr = JSON.stringify(putPolicy);
  const encodedPutPolicy = urlSafeBase64Encode(CryptoJS.enc.Utf8.parse(putPolicyStr));

  // 3. Sign
  const sign = CryptoJS.HmacSHA1(encodedPutPolicy, secretKey);
  const encodedSign = urlSafeBase64Encode(sign);

  // 4. Combine
  return `${accessKey}:${encodedSign}:${encodedPutPolicy}`;
};

/**
 * Generate Download URL (Private or Public)
 * We treat all as private for security safety by default, adding authentication.
 */
export const getDownloadUrl = (config: QiniuConfig): string => {
  const { domain, filename, accessKey, secretKey } = config;
  
  // Ensure protocol
  let baseUrl = domain;
  if (!baseUrl.startsWith('http')) {
    baseUrl = `http://${baseUrl}`;
  }
  // Remove trailing slash
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const url = `${baseUrl}/${filename}`;
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour valid
  
  // Sign the URL
  const urlObj = new URL(url);
  
  // Private download signature: http://<domain>/<key>?e=<deadline>&token=<downloadToken>
  const toSign = `${url}?e=${deadline}`;
  const sign = CryptoJS.HmacSHA1(toSign, secretKey);
  const encodedSign = urlSafeBase64Encode(sign);
  const token = `${accessKey}:${encodedSign}`;
  
  return `${url}?e=${deadline}&token=${token}`;
};

/**
 * Upload JSON data to Qiniu using qiniu-js SDK
 */
export const uploadData = async (config: QiniuConfig, data: any): Promise<void> => {
  const token = genUpToken(config);
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const file = new File([blob], config.filename, { type: 'application/json' });

  // qiniu-js config
  // Map our simple region string to qiniu-js region object if needed, 
  // or let qiniu-js auto-detect (it usually does a good job).
  // However, explicit is better if we know it.
  const putExtra = {
    fname: config.filename,
    params: {},
    mimeType: ['application/json']
  };

  const uploadConfig = {
    useCdnDomain: true,
    // region: qiniu.region.z0 // We can map this if needed, but auto usually works
  };

  return new Promise((resolve, reject) => {
    const observable = qiniu.upload(file, config.filename, token, putExtra, uploadConfig);
    
    // Subscribe to the upload
    observable.subscribe({
      next: (res) => {
        // console.log('Progress:', res.total.percent);
      },
      error: (err) => {
        reject(new Error(err.message || 'Upload failed'));
      },
      complete: (res) => {
        resolve();
      }
    });
  });
};

/**
 * Fetch JSON data from Qiniu
 */
export const fetchData = async (config: QiniuConfig): Promise<any> => {
  const url = getDownloadUrl(config);
  
  // Add a timestamp to prevent browser caching
  const cacheBuster = `&t=${Date.now()}`;
  
  const response = await fetch(url + cacheBuster);
  
  if (response.status === 404) {
    // File doesn't exist yet, return null to indicate we should init it
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch data from Qiniu');
  }

  return response.json();
};