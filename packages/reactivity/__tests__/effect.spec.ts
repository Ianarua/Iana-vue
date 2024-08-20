import { effect } from '../src/effect';

describe('effect', () => {
  it('should run the passed function once (wrapped by a effect)', () => {
    const fnSpy = vi.fn(() => {});
    effect(fnSpy);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });
});
