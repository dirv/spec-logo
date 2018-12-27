import { builtInFunctions } from './language/functionTable';
import { parseAndSaveStatement } from './language/parseCall';
import { performAll } from './language/perform';

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split('\n').map(l => l.split(' ')).flat());

function performAllFinished(state) {
  const updatedState = performAll(
    state,
    state.parsedInstructions.filter(instruction => !instruction.isPerformed));
  return {
    ...updatedState,
    parsedInstructions: updatedState.parsedInstructions.map(instruction => ({
      ...instruction, isPerformed: true
    }))
  };
}

export function parseStatement(line, state) {
  try {
    const updatedState = tokens(line).reduce(parseAndSaveStatement, state);
    if (!updatedState.currentInstruction) {
      return { ...performAllFinished(updatedState), currentEditLine: '' };
    } else {
      return { ...state, currentEditLine: line };
    }
  } catch(e) {
    return { ...state, error: { ...e, line } };
  }
}
