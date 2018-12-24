const constantValue = value => ({ get: _ => value });

export const parameterValue = parameter => ({ get: state => {
  return state.collectedParameters[parameter.toLowerCase()];
}});

export const integerParameterValue = parameter => ({ get: state => {
  const argumentValue = state.collectedParameters[parameter.toLowerCase()];
  const integerArgument = parseInt(argumentValue);
  if (Number.isNaN(integerArgument)) {
    throw ({ description: 'Argument is not an integer' });
  }
  return integerArgument;
}});

export const negate = value => ({ get: state => -value.get(state) });
