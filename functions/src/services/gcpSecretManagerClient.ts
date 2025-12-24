/*
  File: gcpSecretManagerClient.ts
  Description: This module provides utility functions for retrieving secret values from Google Cloud Secret Manager.
  It exports the 'getGCPSecretValue' function, which retrieves the value of a specified secret key.
  The function uses the @google-cloud/secret-manager package for interacting with Google Cloud Secret Manager.
*/
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
import {config} from '../helpers/config';

const client = new SecretManagerServiceClient();

/*
  Function: getGCPSecretValue
  Description: Retrieves the value of a specified secret key from Google Cloud Secret Manager,
               caching it globally to avoid repeated lookups.
  Parameters:
    secretKey (string): The key of the secret to retrieve.
  Returns: The value of the secret as a string.
*/

const secretCache: Record<string, string> = {};

export const getGCPSecretValue = async (secretKey: string): Promise<string> => {
  // Check if the secret is already in the cache
  if (secretCache[secretKey]) {
    return secretCache[secretKey];
  }

  // Fetch the secret from GCP Secret Manager
  const [version] = await client.accessSecretVersion({
    name: `projects/${config.projectId}/secrets/${secretKey}/versions/latest`,
  });

  if (version.payload && version.payload.data) {
    const payload = version.payload.data.toString();

    // Store the secret value in the cache
    secretCache[secretKey] = payload;
    return payload;
  }

  return '';
};