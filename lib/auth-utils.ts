export function sanitizeAuthError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please try again.'
    }
    if (message.includes('user already registered') || message.includes('email already')) {
      return 'An account with this email already exists. Please sign in or use a different email.'
    }
    if (message.includes('password')) {
      if (message.includes('weak')) {
        return 'Password is too weak. Please use a stronger password with at least 8 characters.'
      }
      if (message.includes('match')) {
        return 'Passwords do not match. Please check and try again.'
      }
      return 'Invalid password. Please check your password and try again.'
    }
    if (message.includes('email') && message.includes('invalid')) {
      return 'Invalid email address. Please enter a valid email.'
    }
    if (message.includes('network')) {
      return 'Network error. Please check your connection and try again.'
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment and try again.'
    }
    if (message.includes('not found')) {
      return 'The requested resource was not found.'
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'You are not authorized to perform this action.'
    }
    if (message.includes('timeout')) {
      return 'The request timed out. Please try again.'
    }
    
    return 'An unexpected error occurred. Please try again later.'
  }
  
  return 'An unexpected error occurred. Please try again later.'
}

export function sanitizeFormError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('violates check constraint')) {
      return 'Invalid data submitted. Please check your inputs and try again.'
    }
    if (message.includes('violates foreign key constraint')) {
      return 'Invalid reference. Please try again.'
    }
    if (message.includes('violates unique constraint')) {
      return 'This entry already exists. Please try again.'
    }
    if (message.includes('null value')) {
      return 'Missing required fields. Please fill in all required fields.'
    }
    
    return 'An error occurred while saving your data. Please try again.'
  }
  
  return 'An error occurred while saving your data. Please try again.'
}