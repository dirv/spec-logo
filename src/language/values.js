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

export const valueOrError = (arg, f) => {
  if (arg.startsWith(':')) {
    return f(parameterValue(arg.substring(1)));
  }
  const integerArgument = parseInt(arg);
  if (Number.isNaN(integerArgument)) {
    return {
      error: {
        description: 'Argument is not an integer'
      }
    }
  }
  return f(constantValue(integerArgument));
};
