import { z } from 'zod';
import { HASH_LENGTH } from './constants';

export const hashSchema = z.string().length(HASH_LENGTH);

export const createSecretSchema = z.object({
	accessKey: hashSchema,
	manageKey: hashSchema,
	ciphertext: z.string().min(1),
	testCiphertext: z.string().min(1),
	isProtected: z.boolean(),
	isBurnable: z.boolean(),
	lifetime: z.number().int().positive(),
	v: z.number().int().nonnegative(),
	attachmentUploadTokenHash: hashSchema.optional(),
});

export const importSecretSchema = z.object({
	access_key: hashSchema,
	manage_key: hashSchema,
	test_hash: z.string().length(HASH_LENGTH),
	content: z.string().min(1),
	expires_at: z.string().datetime(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime(),
	is_protected: z.boolean(),
	is_burnable: z.boolean(),
	v: z.number().int().nonnegative(),
});

export const validateHash = (value: string) =>
	hashSchema.safeParse(value).success;
