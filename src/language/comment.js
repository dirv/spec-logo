export const comment = {
  names: [';'],
  initial: {},
  isWriteProtected: true,
  parameters: [],
  parseToken: state => ({ isComplete: true }),
  perform: state => state
};
