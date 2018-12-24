import { builtInFunctions } from './language/functionTable';
import { parseNextToken } from './language/parseCall';
import { perform } from './language/perform';

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split(' '));

function parseAndPerform(state, nextToken) {
    return perform(parseNextToken(state, nextToken));
}

export function parseLine(line, state) {
  if (!state.allFunctions) {
    state = { ...state, allFunctions: builtInFunctions };
  }
  try {
    const updatedState = tokens(line).reduce(parseAndPerform, state);
    return {
      ...updatedState,
      acceptedLines: [...updatedState.acceptedLines, line]
    };
  } catch(e) {
    return { ...state, error:  { ...e, line } };
  }
}
