import { parseCall } from './parseCall';
import { parameterValue, integerParameterValue } from './values';
import { performAll } from './perform';

const duplicateArrayItems = (array, times) => Array(times).fill(array).flat();

export const repeat = {
  names: [ 'repeat', 'rp' ],
  isWriteProtected: true,
  parameters: [ 'times', 'statements' ],
  parseToken: parseCall,
  perform: state => performAll(
    state,
    duplicateArrayItems(
      parameterValue('statements').get(state),
      integerParameterValue('times').get(state)))
};
