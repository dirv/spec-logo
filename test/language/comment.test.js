import { comment } from '../../src/language/comment';

describe('parse', () => {
  it('parses single word comment', () => {
    expect(comment.parseToken({ }, 'comment')).toEqual({ isComplete: true });
  });
});

describe('perform', () => {
  it('does nothing except return the same state', () => {
    const state = { a: 123 };
    expect(comment.perform(state)).toEqual(state);
  });
});
