/**
 * Validation utilities
 * 
 * Functions for validating user input, particularly for team and league IDs
 */

// ============================================================================
// ID VALIDATION
// ============================================================================

/**
 * Validate that a string represents a valid numeric ID
 */
export function isValidNumericId(value: string): boolean {
  if (!value.trim()) return false;
  
  // Must be a positive integer
  const num = parseInt(value.trim(), 10);
  return !isNaN(num) && num > 0 && num.toString() === value.trim();
}

/**
 * Validate team ID format
 */
export function validateTeamId(teamId: string): {
  isValid: boolean;
  error?: string;
} {
  if (!teamId.trim()) {
    return {
      isValid: false,
      error: 'Team ID is required'
    };
  }

  if (!isValidNumericId(teamId)) {
    return {
      isValid: false,
      error: 'Team ID must be a positive number'
    };
  }

  const num = parseInt(teamId.trim(), 10);
  
  // Check reasonable bounds (1 to 999999999)
  if (num < 1 || num > 999999999) {
    return {
      isValid: false,
      error: 'Team ID must be between 1 and 999,999,999'
    };
  }

  return { isValid: true };
}

/**
 * Validate league ID format
 */
export function validateLeagueId(leagueId: string): {
  isValid: boolean;
  error?: string;
} {
  if (!leagueId.trim()) {
    return {
      isValid: false,
      error: 'League ID is required'
    };
  }

  if (!isValidNumericId(leagueId)) {
    return {
      isValid: false,
      error: 'League ID must be a positive number'
    };
  }

  const num = parseInt(leagueId.trim(), 10);
  
  // Check reasonable bounds (1 to 999999999)
  if (num < 1 || num > 999999999) {
    return {
      isValid: false,
      error: 'League ID must be between 1 and 999,999,999'
    };
  }

  return { isValid: true };
}

/**
 * Validate match ID format
 */
export function validateMatchId(matchId: string): {
  isValid: boolean;
  error?: string;
} {
  if (!matchId.trim()) {
    return {
      isValid: false,
      error: 'Match ID is required'
    };
  }

  if (!isValidNumericId(matchId)) {
    return {
      isValid: false,
      error: 'Match ID must be a positive number'
    };
  }

  const num = parseInt(matchId.trim(), 10);
  
  // Check reasonable bounds (1 to 999999999999)
  if (num < 1 || num > 999999999999) {
    return {
      isValid: false,
      error: 'Match ID must be between 1 and 999,999,999,999'
    };
  }

  return { isValid: true };
}

/**
 * Validate player ID format
 */
export function validatePlayerId(playerId: string): {
  isValid: boolean;
  error?: string;
} {
  if (!playerId.trim()) {
    return {
      isValid: false,
      error: 'Player ID is required'
    };
  }

  if (!isValidNumericId(playerId)) {
    return {
      isValid: false,
      error: 'Player ID must be a positive number'
    };
  }

  const num = parseInt(playerId.trim(), 10);
  
  // Check reasonable bounds (1 to 999999999999)
  if (num < 1 || num > 999999999999) {
    return {
      isValid: false,
      error: 'Player ID must be between 1 and 999,999,999,999'
    };
  }

  return { isValid: true };
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

/**
 * Validate team form (both team ID and league ID)
 */
export function validateTeamForm(teamId: string, leagueId: string): {
  isValid: boolean;
  errors: {
    teamId?: string;
    leagueId?: string;
  };
} {
  const teamIdValidation = validateTeamId(teamId);
  const leagueIdValidation = validateLeagueId(leagueId);

  const errors: { teamId?: string; leagueId?: string } = {};
  
  if (!teamIdValidation.isValid) {
    errors.teamId = teamIdValidation.error;
  }
  
  if (!leagueIdValidation.isValid) {
    errors.leagueId = leagueIdValidation.error;
  }

  return {
    isValid: teamIdValidation.isValid && leagueIdValidation.isValid,
    errors
  };
}

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

/**
 * Get ARIA attributes for validation state
 */
export function getValidationAriaAttributes(
  isValid: boolean,
  hasError: boolean,
  errorMessage?: string
): {
  'aria-invalid': boolean;
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
} {
  return {
    'aria-invalid': hasError,
    ...(hasError && errorMessage && {
      'aria-errormessage': errorMessage
    })
  };
} 