import { parseAndSaveStatement } from '../../src/language/parseCall';

describe('parseAndSaveStatement', () => {
  let state;

  describe('completing an instruction', () => {
    beforeEach(() => {
      state = parseAndSaveStatement({
        parsedInstructions: [],
        currentInstruction: {
          parsedTokens: [],
          isComplete: true,
          functionDefinition: { parseToken: () => ({ a: 123 }) } } }, 'token');
    });

    it('appends currentInstruction to parsedInstructions when it is complete', () => {
      expect(state.parsedInstructions.length).toEqual(1);
      expect(state.parsedInstructions[0].a).toEqual(123);
    });

    it('removes currentInstruction if it has been completed', () => {
      expect(state.currentInstruction).not.toBeDefined();
    });

    it('adds this token into the currentInstruction parsedTokens after parsing', () => {
      expect(state.parsedInstructions[0].parsedTokens).toEqual(['token']);
    });
  });

  describe('beginning a new token', () => {
    beforeEach(() => {
      state = parseAndSaveStatement({
        parsedInstructions: [],
        currentInstruction: undefined,
        allFunctions: [ { names: ['forward'] } ]
      }, 'forward');
    });

    it('adds this token into the currentInstruction parseTokens', () => {
      expect(state.currentInstruction.parsedTokens).toEqual(['forward']);
    });
  });
});
