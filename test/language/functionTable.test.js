import { builtInFunctions } from '../../src/language/functionTable';
import { clearScreen } from '../../src/language/clearScreen';

describe('built-in functions', () => {
  it('contains clearScreen', () => {
    expect(builtInFunctions).toContain(clearScreen);
  });
});
