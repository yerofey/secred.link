import { HASH_LENGTH } from './constants';

/** Stable validation messages returned by the Worker HTTP API. */
export const ApiValidationMessage = {
	hashAccessKey: `accessKey must be a string with exactly ${HASH_LENGTH} characters`,
	hashAccessAndManageKey: `accessKey and manageKey must be strings with exactly ${HASH_LENGTH} characters`,
	missingUploadToken: 'missing X-Upload-Token header',
} as const;
