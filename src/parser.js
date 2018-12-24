import { builtInFunctions } from './language/functionTable';
import { parseNextToken } from './language/parseCall';
import { perform } from './language/perform';

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split(' '));

function parseAndPerform(state, nextToken) {
  try {
    return perform(parseNextToken(state, nextToken));
  } catch(e) {
    return {...state, error: e};
  }
}

export function parseLine(line, state) {
  if (!state.allFunctions) {
    state = { ...state, allFunctions: builtInFunctions };
  }
  const updatedState = tokens(line).reduce(parseAndPerform, state);
  if(!updatedState.error) {
    return {
      ...updatedState,
      acceptedLines: [...updatedState.acceptedLines, line]
    };
  } else {
    return {
      ...updatedState,
      error: { ...updatedState.error, line }
    };
  };
}
