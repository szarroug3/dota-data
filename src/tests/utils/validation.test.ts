import { getValidationAriaAttributes } from '@/utils/validation';

describe('getValidationAriaAttributes', () => {
  it('returns no error attributes when valid', () => {
    expect(getValidationAriaAttributes(false, 'field-error')).toEqual({
      'aria-invalid': false,
    });
  });

  it('returns describedby and errormessage when error id is provided', () => {
    expect(getValidationAriaAttributes(true, 'team-id-error')).toEqual({
      'aria-invalid': true,
      'aria-describedby': 'team-id-error',
      'aria-errormessage': 'team-id-error',
    });
  });

  it('returns only aria-invalid when error id is missing', () => {
    expect(getValidationAriaAttributes(true)).toEqual({
      'aria-invalid': true,
    });
  });
});
