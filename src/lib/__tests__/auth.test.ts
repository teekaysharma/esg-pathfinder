import jwt from 'jsonwebtoken'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractTokenFromHeader,
} from '../auth-utils'

process.env.JWT_SECRET = 'test-super-secret-jwt-key-for-testing-only-32-chars'

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123!'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123!'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!'
      const wrongPassword = 'wrongPassword456!'
      const hashedPassword = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'VIEWER' as const,
      }

      const token = generateToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'VIEWER' as const,
      }

      const token = generateToken(payload)
      const decoded = verifyToken(token)

      expect(decoded).toMatchObject(payload)
    })

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const decoded = verifyToken(invalidToken)

      expect(decoded).toBeNull()
    })

    it('should reject expired token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'VIEWER' as const,
      }

      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: -1 })
      const decoded = verifyToken(expiredToken)
      expect(decoded).toBeNull()
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'test.jwt.token'
      const header = `Bearer ${token}`

      const extracted = extractTokenFromHeader(header)
      expect(extracted).toBe(token)
    })

    it('should return null for invalid header format', () => {
      const header = 'InvalidFormat token'

      const extracted = extractTokenFromHeader(header)
      expect(extracted).toBeNull()
    })

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined)
      expect(extracted).toBeNull()
    })

    it('should return null for empty header', () => {
      const extracted = extractTokenFromHeader('')
      expect(extracted).toBeNull()
    })
  })
})
