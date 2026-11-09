import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Light } from '../../model/mapCluster';
import type { CityOption } from '../../model/types';
import { PlaceList } from './PlaceList';

const size = { w: 800, h: 600 };
const view = { x: 0.5, y: 0.5, z: 3 };
const settled = { view, size };

const light = (i: number): Light => ({ key: `c${i}|x`, x: 0.5, y: 0.5, n: 1000 - i, soon: 0 });
const lights = Array.from({ length: 90 }, (_, i) => light(i));
const cities: CityOption[] = lights.map((l, i) => ({ key: l.key, city: `City${i}`, region: 'X', country: 'Canada', count: 1 }));

async function open(props: Partial<Parameters<typeof PlaceList>[0]> = {}) {
  render(<PlaceList lights={lights} byMetro={[]} picked={[]} cities={cities} settled={settled} onToggle={vi.fn()} {...props} />);
  await userEvent.click(screen.getByRole('button', { name: /List the places/ }));
}

describe('PlaceList', () => {
  it('keeps a picked place on the list when the rest are capped', async () => {
    await open({ picked: ['c89|x'] });
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(79);
    expect(screen.getByRole('button', { pressed: true })).toHaveTextContent('City89');
  });

  it('says how many more are in view when capped', async () => {
    await open();
    expect(screen.getByText('10 more in view. Zoom in to see them.')).toBeInTheDocument();
  });

  it('says nothing more when every place fits', async () => {
    await open({ lights: lights.slice(0, 80) });
    expect(screen.queryByText(/more in view/)).toBeNull();
  });

  it('lists a place known only by its metro as by metro area, with no distance', async () => {
    const metro: Light = { key: 'town|x', x: 0.5, y: 0.5, n: 3, soon: 0 };
    const towns: CityOption[] = [{ key: 'town|x', city: 'Town', region: 'X', country: 'Canada', count: 3 }];
    await open({ lights: [], byMetro: [metro], cities: towns });
    expect(screen.getByText('by metro area')).toBeInTheDocument();
    expect(screen.getByText('Town')).toBeInTheDocument();
    expect(screen.queryByText(/km/)).toBeNull();
    expect(screen.queryByText(/No city lights/)).toBeNull();
  });
});
