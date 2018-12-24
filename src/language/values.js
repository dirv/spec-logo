const constantValue = value => ({ get: _ => value });
const parameterValue = parameter => ({ get: state => parseInt(state.collectedParameters[parameter.substring(1).toLowerCase()]) });

export const negateIntegerValue = value => ({ get: state => -value.get(state) });

export const valueOrError = (arg, f) => {
  if (arg.startsWith(':')) {
    return f(parameterValue(arg));
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

export const parseSingle = (_, nextArg) =>
  valueOrError(nextArg, value => ({ isComplete: true, value }));

