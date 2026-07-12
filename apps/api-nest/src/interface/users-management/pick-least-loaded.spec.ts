import { pickLeastLoadedId } from '@forreal/application';

// Règle partagée : attribution d'un advisor à un nouveau client ET d'une
// demande de bannissement à un director.
describe('pickLeastLoadedId', () => {
  it('returns null when there is no candidate', () => {
    expect(pickLeastLoadedId([])).toBeNull();
  });

  it('picks the single least-loaded candidate', () => {
    const chosen = pickLeastLoadedId([
      { id: 'a', count: 10 },
      { id: 'b', count: 7 },
      { id: 'c', count: 9 },
    ]);
    expect(chosen).toBe('b');
  });

  it('picks randomly among tied least-loaded candidates only', () => {
    const candidates = [
      { id: 'a', count: 10 },
      { id: 'b', count: 7 },
      { id: 'c', count: 7 },
    ];
    // random → 0 : premier ex æquo ; random → 0.99 : dernier ex æquo.
    expect(pickLeastLoadedId(candidates, () => 0)).toBe('b');
    expect(pickLeastLoadedId(candidates, () => 0.99)).toBe('c');
  });

  it('never picks a candidate above the minimum', () => {
    for (let i = 0; i < 20; i++) {
      const chosen = pickLeastLoadedId([
        { id: 'a', count: 3 },
        { id: 'b', count: 1 },
        { id: 'c', count: 1 },
        { id: 'd', count: 2 },
      ]);
      expect(['b', 'c']).toContain(chosen);
    }
  });
});
