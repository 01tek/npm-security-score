const { getScoreBand, shouldBlock, getScoreInterpretation } = require('../scoreBands');

describe('scoreBands', () => {
  describe('getScoreBand', () => {
    it('should return SAFE band for scores 90-100', () => {
      expect(getScoreBand(100).key).toBe('SAFE');
      expect(getScoreBand(95).key).toBe('SAFE');
      expect(getScoreBand(90).key).toBe('SAFE');
    });

    it('should return REVIEW band for scores 70-89', () => {
      expect(getScoreBand(89).key).toBe('REVIEW');
      expect(getScoreBand(80).key).toBe('REVIEW');
      expect(getScoreBand(70).key).toBe('REVIEW');
    });

    it('should return HIGH_RISK band for scores 50-69', () => {
      expect(getScoreBand(69).key).toBe('HIGH_RISK');
      expect(getScoreBand(60).key).toBe('HIGH_RISK');
      expect(getScoreBand(50).key).toBe('HIGH_RISK');
    });

    it('should return BLOCK band for scores 0-49', () => {
      expect(getScoreBand(49).key).toBe('BLOCK');
      expect(getScoreBand(25).key).toBe('BLOCK');
      expect(getScoreBand(0).key).toBe('BLOCK');
    });

    it('should throw error for invalid score', () => {
      expect(() => getScoreBand('invalid')).toThrow('Score must be a valid number');
      expect(() => getScoreBand(NaN)).toThrow('Score must be a valid number');
    });
  });

  describe('shouldBlock', () => {
    it('should return true for scores below 50', () => {
      expect(shouldBlock(49)).toBe(true);
      expect(shouldBlock(0)).toBe(true);
      expect(shouldBlock(25)).toBe(true);
    });

    it('should return false for scores 50 and above', () => {
      expect(shouldBlock(50)).toBe(false);
      expect(shouldBlock(75)).toBe(false);
      expect(shouldBlock(100)).toBe(false);
    });
  });

  describe('getScoreInterpretation', () => {
    it('should return interpretation for safe scores', () => {
      const interpretation = getScoreInterpretation(95);
      expect(interpretation).toContain('Safe');
      expect(interpretation).toContain('✅');
    });

    it('should return interpretation for review scores', () => {
      const interpretation = getScoreInterpretation(75);
      expect(interpretation).toContain('Review');
      expect(interpretation).toContain('⚠️');
    });

    it('should return interpretation for high risk scores', () => {
      const interpretation = getScoreInterpretation(55);
      expect(interpretation).toContain('High Risk');
      expect(interpretation).toContain('❌');
    });

    it('should return interpretation for block scores', () => {
      const interpretation = getScoreInterpretation(30);
      expect(interpretation).toContain('Block');
      expect(interpretation).toContain('🚨');
    });
  });
});
