import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword, dummyHash } from './password'

describe('password hashing', () => {
  it('hashes a password into a bcrypt digest (not the plaintext)', async () => {
    const hash = await hashPassword('S3cret-pass!')
    expect(hash).not.toBe('S3cret-pass!')
    expect(hash.startsWith('$2')).toBe(true)
  })

  it('verifies a correct password', async () => {
    const hash = await hashPassword('S3cret-pass!')
    expect(await comparePassword('S3cret-pass!', hash)).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('S3cret-pass!')
    expect(await comparePassword('wrong-pass', hash)).toBe(false)
  })

  it('uses a random salt (same input -> different hashes)', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')])
    expect(a).not.toBe(b)
  })

  it('dummyHash returns a valid bcrypt hash (constant-time guard)', async () => {
    const hash = await dummyHash('anything')
    expect(hash.startsWith('$2')).toBe(true)
  })
})
