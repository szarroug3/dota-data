/**
 * Validation utilities for API endpoints
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue: Record<string, string | number | boolean | null | undefined>;
}

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'boolean' | 'number';
    required?: boolean;
    enum?: string[];
    default?: string | number | boolean | null | undefined;
  };
}

export class ValidationHelpers {
  /**
   * Validate query parameters against a schema
   */
  static validateQueryParams(
    searchParams: URLSearchParams,
    schema: ValidationSchema
  ): ValidationResult {
    const errors: string[] = [];
    const sanitizedValue: Record<string, string | number | boolean | null | undefined> = {};

    for (const [key, rules] of Object.entries(schema)) {
      const value = searchParams.get(key);
      if (this.isMissingRequired(value, rules)) {
        errors.push(`Missing required parameter: ${key}`);
        continue;
      }
      if (this.shouldUseDefault(value, rules)) {
        sanitizedValue[key] = rules.default;
        continue;
      }
      try {
        let convertedValue = this.convertType(value, rules.type);
        if (this.isEnumInvalid(key, convertedValue, rules)) {
          errors.push(this.enumErrorMessage(key, value, rules));
          continue;
        }
        if (this.shouldNormalizePrimaryAttribute(key, convertedValue)) {
          convertedValue = (convertedValue as string).toLowerCase();
        }
        sanitizedValue[key] = convertedValue;
      } catch (error) {
        errors.push(`Validation error for ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };
  }

  private static isMissingRequired(value: string | null, rules: ValidationSchema[string]): boolean {
    return !!(rules.required && !value);
  }

  private static shouldUseDefault(value: string | null, rules: ValidationSchema[string]): boolean {
    return !value && rules.default !== undefined;
  }

  private static convertType(value: string | null, type: 'string' | 'boolean' | 'number'): string | number | boolean | null | undefined {
    if (value === null) return value;
    switch (type) {
      case 'boolean':
        return value === 'true' || value === '1';
      case 'number': {
        const num = parseFloat(value);
        if (isNaN(num)) throw new Error(`Invalid number value: ${value}`);
        return num;
      }
      case 'string':
        return value.trim();
      default:
        return value;
    }
  }

  private static isEnumInvalid(key: string, value: string | number | boolean | null | undefined, rules: ValidationSchema[string]): boolean {
    if (!rules.enum) return false;
    // Allow null/undefined values for optional parameters
    if (value === null || value === undefined) return false;
    const enumValues = rules.enum;
    const normalizedValue = key === 'primaryAttribute' && typeof value === 'string' ? value.toLowerCase() : value;
    const normalizedEnum = key === 'primaryAttribute' ? enumValues.map(v => v.toLowerCase()) : enumValues;
    return !normalizedEnum.includes(normalizedValue as string);
  }

  private static enumErrorMessage(key: string, value: string | null, rules: ValidationSchema[string]): string {
    return `Invalid value for ${key}: ${value}. Must be one of: ${rules.enum?.join(', ')}`;
  }

  private static shouldNormalizePrimaryAttribute(key: string, value: string | number | boolean | null | undefined): boolean {
    return key === 'primaryAttribute' && typeof value === 'string';
  }
}

export const CommonSchemas = {
  forceRefreshQuery: {
    force: {
      type: 'boolean' as const,
      default: false
    }
  },
  heroFilterQuery: {
    complexity: {
      type: 'string' as const,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    role: {
      type: 'string' as const
    },
    primaryAttribute: {
      type: 'string' as const,
      enum: ['strength', 'agility', 'intelligence', 'universal']
    },
    tier: {
      type: 'string' as const,
      enum: ['S', 'A', 'B', 'C', 'D']
    }
  }
}; 