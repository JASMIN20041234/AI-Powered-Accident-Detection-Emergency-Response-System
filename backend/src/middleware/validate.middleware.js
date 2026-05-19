/**
 * Lightweight schema-based request body validator.
 * Usage: validate({ username: 'required|string', age: 'number' })
 *
 * Supported rules (pipe-separated): required, string, number, min:<n>, max:<n>, email
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, ruleStr] of Object.entries(schema)) {
      const rules = ruleStr.split('|').map((r) => r.trim());
      const value = req.body[field];
      const present = value !== undefined && value !== null && value !== '';

      for (const rule of rules) {
        if (rule === 'required' && !present) {
          errors.push(`${field} is required`);
          break; // skip further checks for this field
        }
        if (!present) continue; // optional field absent — skip type checks

        if (rule === 'string' && typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
        if (rule === 'number' && isNaN(Number(value))) {
          errors.push(`${field} must be a number`);
        }
        if (rule === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${field} must be a valid email address`);
        }
        if (rule.startsWith('min:')) {
          const min = Number(rule.split(':')[1]);
          if (typeof value === 'string' && value.length < min)
            errors.push(`${field} must be at least ${min} characters`);
          if (typeof value === 'number' && value < min)
            errors.push(`${field} must be at least ${min}`);
        }
        if (rule.startsWith('max:')) {
          const max = Number(rule.split(':')[1]);
          if (typeof value === 'string' && value.length > max)
            errors.push(`${field} must be at most ${max} characters`);
          if (typeof value === 'number' && value > max)
            errors.push(`${field} must be at most ${max}`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(422).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
}

module.exports = validate;
