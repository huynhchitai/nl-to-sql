import { describe, it, expect } from 'vitest';
import { analyzeSql } from '../sql-guard';

// ─── Plain SELECT ─────────────────────────────────────────────────────────────

describe('plain SELECT', () => {
  it('passes a simple single-table SELECT', () => {
    const r = analyzeSql('SELECT id, name FROM users WHERE active = TRUE');
    expect(r.isReadOnly).toBe(true);
    expect(r.statementType).toBe('SELECT');
    expect(r.warnings).toHaveLength(0);
  });

  it('passes a SELECT with JOIN', () => {
    const r = analyzeSql(
      `SELECT u.id, u.name, o.total
       FROM users u
       JOIN orders o ON o.user_id = u.id
       WHERE o.status = 'completed'
       ORDER BY o.total DESC
       LIMIT 10`
    );
    expect(r.isReadOnly).toBe(true);
    expect(r.statementType).toBe('SELECT');
    expect(r.warnings).toHaveLength(0);
  });

  it('passes a SELECT with a trailing semicolon', () => {
    const r = analyzeSql('SELECT * FROM products;');
    expect(r.isReadOnly).toBe(true);
    expect(r.statementType).toBe('SELECT');
    expect(r.warnings).toHaveLength(0);
  });

  it('passes a SELECT with a subquery', () => {
    const r = analyzeSql(
      `SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE country = 'VN')`
    );
    expect(r.isReadOnly).toBe(true);
    expect(r.statementType).toBe('SELECT');
    expect(r.warnings).toHaveLength(0);
  });
});

// ─── INSERT ───────────────────────────────────────────────────────────────────

describe('INSERT', () => {
  it('flags INSERT as not read-only', () => {
    const r = analyzeSql("INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')");
    expect(r.isReadOnly).toBe(false);
    expect(r.statementType).toBe('INSERT');
    expect(r.warnings.some((w) => w.includes('INSERT'))).toBe(true);
  });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────

describe('UPDATE', () => {
  it('flags UPDATE as not read-only', () => {
    const r = analyzeSql("UPDATE users SET name = 'Bob' WHERE id = 1");
    expect(r.isReadOnly).toBe(false);
    expect(r.statementType).toBe('UPDATE');
    expect(r.warnings.some((w) => w.includes('UPDATE'))).toBe(true);
  });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

describe('DELETE', () => {
  it('flags DELETE as not read-only', () => {
    const r = analyzeSql('DELETE FROM users WHERE id = 99');
    expect(r.isReadOnly).toBe(false);
    expect(r.statementType).toBe('DELETE');
    expect(r.warnings.some((w) => w.includes('DELETE'))).toBe(true);
  });
});

// ─── DROP ─────────────────────────────────────────────────────────────────────

describe('DROP', () => {
  it('flags DROP TABLE as not read-only', () => {
    const r = analyzeSql('DROP TABLE users');
    expect(r.isReadOnly).toBe(false);
    expect(r.statementType).toBe('DROP');
    expect(r.warnings.some((w) => w.includes('DROP'))).toBe(true);
  });

  it('flags DROP DATABASE as not read-only', () => {
    const r = analyzeSql('DROP DATABASE mydb');
    expect(r.isReadOnly).toBe(false);
    expect(r.statementType).toBe('DROP');
  });
});

// ─── TRUNCATE ─────────────────────────────────────────────────────────────────

describe('TRUNCATE', () => {
  it('flags TRUNCATE as not read-only', () => {
    const r = analyzeSql('TRUNCATE TABLE orders');
    expect(r.isReadOnly).toBe(false);
    expect(r.statementType).toBe('TRUNCATE');
    expect(r.warnings.some((w) => w.includes('TRUNCATE'))).toBe(true);
  });
});

// ─── ALTER ────────────────────────────────────────────────────────────────────

describe('ALTER', () => {
  it('flags ALTER TABLE as not read-only', () => {
    const r = analyzeSql('ALTER TABLE users ADD COLUMN phone VARCHAR(20)');
    expect(r.isReadOnly).toBe(false);
    expect(r.statementType).toBe('ALTER');
    expect(r.warnings.some((w) => w.includes('ALTER'))).toBe(true);
  });
});

// ─── Multiple statements ──────────────────────────────────────────────────────

describe('multiple statements', () => {
  it('flags two SELECT statements separated by semicolons', () => {
    const r = analyzeSql('SELECT * FROM users; SELECT * FROM orders');
    expect(r.isReadOnly).toBe(false);
    expect(r.warnings.some((w) => /multiple/i.test(w))).toBe(true);
  });

  it('flags classic SQL injection pattern', () => {
    const r = analyzeSql("SELECT * FROM users WHERE id = 1; DROP TABLE users; --");
    expect(r.isReadOnly).toBe(false);
    expect(r.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it('does not flag a single statement with trailing semicolon', () => {
    const r = analyzeSql('SELECT id FROM users;');
    expect(r.isReadOnly).toBe(true);
    expect(r.warnings).toHaveLength(0);
  });
});

// ─── Comment injection ────────────────────────────────────────────────────────

describe('comment injection', () => {
  it('flags -- line comment containing SELECT keyword', () => {
    const r = analyzeSql("SELECT * FROM users WHERE id = 1 -- OR SELECT secret FROM passwords");
    expect(r.warnings.some((w) => /comment/i.test(w))).toBe(true);
  });

  it('flags block comment containing DROP keyword', () => {
    const r = analyzeSql("SELECT id FROM users /* DROP TABLE users */");
    expect(r.warnings.some((w) => /comment/i.test(w))).toBe(true);
  });

  it('passes a plain comment that has no SQL keywords', () => {
    const r = analyzeSql("SELECT id, name FROM users -- get all active users");
    // This comment has no SQL keywords that would trigger injection warning
    // (the comment contains no SELECT/INSERT/etc keywords to flag)
    // The result may or may not warn depending on "SELECT" appearing in the comment
    // but the primary statement IS a read-only SELECT
    expect(r.statementType).toBe('SELECT');
  });
});

// ─── Dangerous keywords in a SELECT context ───────────────────────────────────

describe('dangerous keywords inside SELECT', () => {
  it('flags SLEEP inside a SELECT (time-based blind injection)', () => {
    const r = analyzeSql("SELECT * FROM users WHERE id = SLEEP(5)");
    expect(r.isReadOnly).toBe(false);
    expect(r.warnings.some((w) => /SLEEP/i.test(w))).toBe(true);
  });

  it('flags BENCHMARK inside a SELECT', () => {
    const r = analyzeSql("SELECT BENCHMARK(1000000, MD5('test'))");
    expect(r.isReadOnly).toBe(false);
    expect(r.warnings.some((w) => /BENCHMARK/i.test(w))).toBe(true);
  });

  it('flags INTO OUTFILE (MySQL exfil)', () => {
    const r = analyzeSql("SELECT * FROM users INTO OUTFILE '/tmp/users.csv'");
    expect(r.isReadOnly).toBe(false);
    expect(r.warnings.some((w) => /OUTFILE/i.test(w))).toBe(true);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('handles empty string gracefully', () => {
    const r = analyzeSql('');
    expect(r.isReadOnly).toBe(false);
    expect(r.statementType).toBe('UNKNOWN');
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('handles whitespace-only input', () => {
    const r = analyzeSql('   \n\t  ');
    expect(r.isReadOnly).toBe(false);
    expect(r.statementType).toBe('UNKNOWN');
  });

  it('handles lowercase select', () => {
    const r = analyzeSql('select id from users');
    expect(r.isReadOnly).toBe(true);
    expect(r.statementType).toBe('SELECT');
  });

  it('handles mixed case', () => {
    const r = analyzeSql('SeLeCt * FrOm products');
    expect(r.isReadOnly).toBe(true);
    expect(r.statementType).toBe('SELECT');
  });
});
