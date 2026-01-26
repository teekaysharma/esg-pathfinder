import { 
  sanitizeInput, 
  sanitizeHtml, 
  sanitizeSqlInput,
  commonValidations,
  esgValidations,
  validateRequest,
  validateQuery
} from '../validation'

describe('Validation Utilities', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World'
      const result = sanitizeInput(input)
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Hello World')
    })

    it('should remove SQL injection patterns', () => {
      const input = "'; DROP TABLE users; --"
      const result = sanitizeInput(input)
      expect(result).toBe('&#x27; DROP TABLE users ')
    })

    it('should handle null and undefined', () => {
      expect(sanitizeInput(null as any)).toBe(null as any)
      expect(sanitizeInput(undefined as any)).toBe(undefined as any)
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const result = sanitizeInput(input)
      expect(result).toBe('Hello World')
    })
  })

  describe('sanitizeHtml', () => {
    it('should convert HTML special characters', () => {
      const input = '<div>&"\'</div>'
      const result = sanitizeHtml(input)
      expect(result).toBe('&lt;div&gt;&amp;&quot;&#x27;&lt;/div&gt;')
    })
  })

  describe('sanitizeSqlInput', () => {
    it('should remove SQL injection patterns', () => {
      const input = "'; DROP TABLE users; /* comment */ xp_ sp_"
      const result = sanitizeSqlInput(input)
      expect(result).toBe('&#x27; DROP TABLE users  comment  xp sp')
    })
  })

  describe('commonValidations', () => {
    describe('safeText', () => {
      it('should validate text within limits', () => {
        const schema = commonValidations.safeText(1, 10)
        const result = schema.parse('Hello')
        expect(result).toBe('Hello')
      })

      it('should reject text too short', () => {
        const schema = commonValidations.safeText(5, 10)
        expect(() => schema.parse('Hi')).toThrow()
      })

      it('should reject text too long', () => {
        const schema = commonValidations.safeText(1, 5)
        expect(() => schema.parse('Hello World')).toThrow()
      })

      it('should sanitize input', () => {
        const schema = commonValidations.safeText(1, 20)
        const result = schema.parse('<script>Hello</script>')
        expect(result).toBe('&lt;script&gt;Hello&lt;/script&gt;')
      })
    })

    describe('email', () => {
      it('should validate correct email', () => {
        const result = commonValidations.email.parse('test@example.com')
        expect(result).toBe('test@example.com')
      })

      it('should reject invalid email', () => {
        expect(() => commonValidations.email.parse('invalid-email')).toThrow()
      })
    })

    describe('cuid', () => {
      it('should validate valid CUID', () => {
        const result = commonValidations.cuid.parse('cl9wqzv500000l308z9p3d4zp')
        expect(result).toBe('cl9wqzv500000l308z9p3d4zp')
      })

      it('should reject invalid CUID', () => {
        expect(() => commonValidations.cuid.parse('invalid-id')).toThrow()
      })
    })

    describe('password', () => {
      it('should validate strong password', () => {
        const result = commonValidations.password.parse('StrongP@ssw0rd!')
        expect(result).toBe('StrongP@ssw0rd!')
      })

      it('should reject weak password - no uppercase', () => {
        expect(() => commonValidations.password.parse('weakp@ssw0rd!')).toThrow()
      })

      it('should reject weak password - no lowercase', () => {
        expect(() => commonValidations.password.parse('WEAKP@SSW0RD!')).toThrow()
      })

      it('should reject weak password - no numbers', () => {
        expect(() => commonValidations.password.parse('WeakPassword!')).toThrow()
      })

      it('should reject weak password - no special characters', () => {
        expect(() => commonValidations.password.parse('WeakPassword123')).toThrow()
      })
    })
  })

  describe('esgValidations', () => {
    describe('category', () => {
      it('should validate valid ESG categories', () => {
        expect(() => esgValidations.category.parse('Environmental')).not.toThrow()
        expect(() => esgValidations.category.parse('Social')).not.toThrow()
        expect(() => esgValidations.category.parse('Governance')).not.toThrow()
      })

      it('should reject invalid category', () => {
        expect(() => esgValidations.category.parse('Invalid')).toThrow()
      })
    })

    describe('metricCode', () => {
      it('should validate valid metric code', () => {
        const result = esgValidations.metricCode.parse('GRI_302_1')
        expect(result).toBe('GRI_302_1')
      })

      it('should reject invalid metric code format', () => {
        expect(() => esgValidations.metricCode.parse('invalid-code')).toThrow()
      })
    })

    describe('confidence score', () => {
      it('should validate confidence within range', () => {
        expect(() => esgValidations.confidenceScore.parse(0.5)).not.toThrow()
        expect(() => esgValidations.confidenceScore.parse(0)).not.toThrow()
        expect(() => esgValidations.confidenceScore.parse(1)).not.toThrow()
      })

      it('should reject confidence out of range', () => {
        expect(() => esgValidations.confidenceScore.parse(-0.1)).toThrow()
        expect(() => esgValidations.confidenceScore.parse(1.1)).toThrow()
      })
    })
  })

  describe('validateRequest', () => {
    it('should validate valid request', async () => {
      const schema = commonValidations.safeText(1, 50)
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: 'Test Name' })
      } as any

      const validator = validateRequest(z.object({ name: schema }))
      const result = await validator(mockRequest)

      expect(result.data).toEqual({ name: 'Test Name' })
      expect(result.error).toBeUndefined()
    })

    it('should return error for invalid request', async () => {
      const schema = commonValidations.safeText(5, 50)
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: 'Hi' })
      } as any

      const validator = validateRequest(z.object({ name: schema }))
      const result = await validator(mockRequest)

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('validateQuery', () => {
    it('should validate valid query parameters', () => {
      const schema = z.object({ page: z.string().transform(Number) })
      const searchParams = new URLSearchParams({ page: '1' })

      const validator = validateQuery(schema)
      const result = validator(searchParams)

      expect(result.data).toEqual({ page: 1 })
      expect(result.error).toBeUndefined()
    })

    it('should return error for invalid query parameters', () => {
      const schema = z.object({ page: z.string().transform(Number) })
      const searchParams = new URLSearchParams({ page: 'invalid' })

      const validator = validateQuery(schema)
      const result = validator(searchParams)

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })
})